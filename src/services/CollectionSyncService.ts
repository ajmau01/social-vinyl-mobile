import { dbService } from './DatabaseService';
import {
    Release,
    SyncCallbacks,
    AsyncResult,
    SyncResult,
    Track
} from '@/types';
import { CONFIG } from '../config';
import { ISyncService } from './interfaces';
import { logger } from '@/utils/logger';

interface BackendAlbum {
    releaseId: number;
    instanceId?: number; // camelCase from some sources
    instance_id?: number; // snake_case from backend
    title: string;
    artist: string;
    coverImage: string;
    year?: string;
    label?: string;
    format?: string;
    tracks?: Track[]; // FIXED: Proper type scoping
    genres?: string[]; // We will inject during flattening
    date_added?: string; // ISO date string from Discogs/Backend
    addedTimestamp?: number; // Backend timestamp (ms)
    isNotable?: boolean; // Backend notable flag
    isSaved?: boolean;   // Backend saved flag
    spinCount?: number;  // Backend play count
}

interface ScanResponse {
    albums: BackendAlbum[];
    count: number;
    username: string;
    avatarUrl?: string;
}

class CollectionSyncService implements ISyncService {
    private activeSyncs = new Set<string>();

    public async syncCollection(userId: string, callbacks?: SyncCallbacks): AsyncResult<SyncResult> {
        if (this.activeSyncs.has(userId)) {
            return { success: false, error: new Error('Sync already in progress for this user') };
        }

        this.activeSyncs.add(userId);
        callbacks?.onStatusChange('syncing');
        callbacks?.onProgress(10); // Started

        try {
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Starting sync for user:', userId);

            // Fetch cached data (Read-Only)
            const data = await this.fetchScan(userId);

            if (!data || !data.albums || data.albums.length === 0) {
                throw new Error('Discogs collection is empty or user not found');
            }

            callbacks?.onProgress(50); // Downloaded

            // DESTRUCTIVE SYNC: Clear old data for this user to prevent accumulation
            // and ensure a "mirror" of the Discogs collection.
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Clearing old data for user:', userId);
            await dbService.clearUserCollection(userId);

            await this.saveReleases(data.albums, userId);

            if (CONFIG.DEBUG_WS) logger.log('[Sync] Complete. Items:', data.albums.length);
            callbacks?.onStatusChange('complete');
            callbacks?.onProgress(100);

            return {
                success: true,
                data: {
                    itemCount: data.albums.length,
                    syncTime: Date.now(),
                    avatarUrl: data.avatarUrl
                }
            };

        } catch (error) {
            logger.error('[Sync] Error:', error);
            callbacks?.onStatusChange('error');
            return { success: false, error: error instanceof Error ? error : new Error('Unknown sync error') };
        } finally {
            this.activeSyncs.delete(userId);
        }
    }

    public isSyncing(userId?: string): boolean {
        if (userId) return this.activeSyncs.has(userId);
        return this.activeSyncs.size > 0;
    }

    private async fetchScan(userId: string): Promise<ScanResponse | null> {
        try {
            // Use format=json to get cached collection (Read-Only)
            const url = `${CONFIG.API_URL}/collection?format=json&username=${userId}`;
            logger.log('[Sync] Fetching:', url);

            const response = await fetch(url);

            // Check for "Scan Required" HTML response (which returns 200 OK)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Collection not scanned. Please visit the Web Dashboard to scan your collection first.');
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const rawData = await response.json();

            // The backend returns albums grouped by Genre: { "Rock": [...], "Jazz": [...] }
            // We flatten this into a single list AND deduplicate by instanceId (not releaseId)
            // as one user can have multiple copies of the same album.
            if (rawData && rawData.albums && !Array.isArray(rawData.albums)) {
                const uniqueAlbumsMap = new Map<number, BackendAlbum>();
                const categories = Object.keys(rawData.albums);
                logger.log('[Sync] Categories found:', categories.join(', '));

                for (const [category, albums] of Object.entries(rawData.albums)) {
                    const albumList = albums as BackendAlbum[];
                    for (const album of albumList) {
                        // FIX: Explicitly cast to number and ensure we look at Discogs instance_id
                        const rawInstanceId = album.instance_id || album.instanceId;
                        const instanceId = rawInstanceId ? Number(rawInstanceId) : null;
                        const id = instanceId || album.releaseId;

                        if (!uniqueAlbumsMap.has(id)) {
                            // Ensure instanceId is set for the Release object later
                            uniqueAlbumsMap.set(id, { ...album, instanceId: id || undefined, genres: [category] });
                        } else {
                            const existing = uniqueAlbumsMap.get(id);
                            if (existing && existing.genres && !existing.genres.includes(category)) {
                                // Prioritize specific genres over generic ones like "All" or "Uncategorized"
                                const genericFolders = ['all', 'uncategorized', 'vinyl', 'albums', 'unsorted', 'collection'];
                                const isNewCategoryGeneric = genericFolders.includes(category.toLowerCase());

                                if (isNewCategoryGeneric) {
                                    existing.genres.push(category);
                                } else {
                                    // Put specific genres at the front (index 0)
                                    existing.genres.unshift(category);
                                }
                            }
                        }
                    }
                }

                const flatAlbums = Array.from(uniqueAlbumsMap.values());
                logger.log(`[Sync] Flattening complete. Total unique instances: ${flatAlbums.length}`);

                return {
                    albums: flatAlbums,
                    count: flatAlbums.length,
                    username: rawData.username || userId,
                    avatarUrl: rawData.avatarUrl
                };
            }

            return rawData;
        } catch (error) {
            logger.error(`[Sync] Failed to fetch collection`, error);
            if (error instanceof Error && error.message.includes('not scanned')) {
                throw error;
            }
            return null;
        }
    }

    private async saveReleases(items: BackendAlbum[], userId: string) {
        if (CONFIG.DEBUG_WS && items.length > 0) {
            logger.log(`[Sync] Sample Mapping - ID: ${items[0].releaseId}, Instance: ${items[0].instanceId || items[0].instance_id}, Date: ${items[0].date_added}`);
        }

        // Filter and map - skip albums missing instanceId (fail fast approach)
        const releases: Release[] = [];
        let skippedCount = 0;

        for (const item of items) {
            const rawInstanceId = item.instance_id || item.instanceId;
            if (!rawInstanceId) {
                logger.error('[Sync] Album missing instanceId, skipping:', item.title, item.releaseId);
                skippedCount++;
                continue;
            }

            // Fix for Issue #119: Use addedTimestamp from API (ms) -> Seconds
            // Fallback to date_added (ISO) or now
            let addedAtSeconds = Math.floor(Date.now() / 1000);

            if (item.addedTimestamp && item.addedTimestamp > 0) {
                addedAtSeconds = Math.floor(item.addedTimestamp / 1000);
            } else if (item.date_added) {
                const dateMs = new Date(item.date_added).getTime();
                if (!isNaN(dateMs)) {
                    addedAtSeconds = Math.floor(dateMs / 1000);
                }
            }

            releases.push({
                id: item.releaseId,
                instanceId: Number(rawInstanceId),
                userId: userId,
                title: item.title,
                artist: item.artist,
                thumb_url: item.coverImage || null,
                added_at: addedAtSeconds,
                year: item.year,
                genres: item.genres ? item.genres.join(', ') : undefined,
                label: item.label,
                format: item.format,
                tracks: item.tracks ? JSON.stringify(item.tracks) : undefined,
                isSaved: item.isSaved || false,
                isNotable: item.isNotable || false,
                spinCount: item.spinCount || 0
            });
        }

        if (skippedCount > 0) {
            logger.warn(`[Sync] Skipped ${skippedCount} albums missing instanceId`);
        }

        await dbService.saveReleasesBatch(releases);
    }

    public async fetchTracks(userId: string, releaseId: number): AsyncResult<Track[]> {
        try {
            const url = `${CONFIG.API_URL}/collection?mode=tracklist&releaseId=${releaseId}`;
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Fetching tracks:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();

            if (data && data.tracks) {
                if (userId) {
                    await dbService.updateReleaseTracks(userId, releaseId, JSON.stringify(data.tracks));
                }
                return { success: true, data: data.tracks };
            }
            return { success: false, error: new Error('No tracks found') };
        } catch (error) {
            logger.error('[Sync] Failed to fetch tracks:', error);
            return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
        }
    }

    /**
     * Toggles the 'Notable' (Saved) status on the backend.
     * This ensures the status persists across syncs.
     */
    public async toggleNotable(userId: string, releaseId: number): Promise<boolean> {
        try {
            const url = `${CONFIG.API_URL}/collection?mode=toggleNotable&username=${userId}&releaseId=${releaseId}`;
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Toggling notable status:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                logger.log(`[Sync] Successfully toggled notable for release ${releaseId} to ${data.isNotable}`);
                return true;
            } else {
                logger.error('[Sync] Failed to toggle notable:', data.error);
                return false;
            }
        } catch (error) {
            logger.error('[Sync] Error toggling notable status:', error);
            return false;
        }
    }

    /**
     * Toggles the 'Saved' (Guest) status on the backend.
     */
    public async toggleSaved(userId: string, releaseId: number): Promise<boolean> {
        try {
            const url = `${CONFIG.API_URL}/collection?mode=toggleSaved&username=${userId}&releaseId=${releaseId}`;
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Toggling saved status:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                logger.log(`[Sync] Successfully toggled saved for release ${releaseId} to ${data.isSaved}`);
                return true;
            } else {
                logger.error('[Sync] Failed to toggle saved:', data.error);
                return false;
            }
        } catch (error) {
            logger.error('[Sync] Error toggling saved status:', error);
            return false;
        }
    }
}

export const syncService = new CollectionSyncService();
