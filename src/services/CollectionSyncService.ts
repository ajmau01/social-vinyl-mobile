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
    totalDuration?: number; // Backend total duration in seconds
}

interface ScanResponse {
    albums: BackendAlbum[];
    count: number;
    username: string;
    avatarUrl?: string;
}

class CollectionSyncService implements ISyncService {
    private activeSyncs = new Set<string>();
    private abortControllers = new Map<string, AbortController>();

    public cancelSync(userId: string) {
        if (this.abortControllers.has(userId)) {
            logger.log('[Sync] Cancelling sync for user:', userId);
            this.abortControllers.get(userId)?.abort();
            this.abortControllers.delete(userId);
            this.activeSyncs.delete(userId);
        }
    }

    public async syncCollection(userId: string, callbacks?: SyncCallbacks): AsyncResult<SyncResult> {
        if (this.activeSyncs.has(userId)) {
            return { success: false, error: new Error('Sync already in progress for this user') };
        }

        this.activeSyncs.add(userId);
        const controller = new AbortController();
        this.abortControllers.set(userId, controller);

        callbacks?.onStatusChange('syncing');
        callbacks?.onProgress(0);

        try {
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Starting async sync for user:', userId);

            // Check for cancellation
            if (controller.signal.aborted) throw new Error('Sync cancelled');

            // 1. Start Async Job
            const startUrl = `${CONFIG.API_URL}/collection?mode=startScan&username=${userId}`;
            const startRes = await fetch(startUrl, {
                method: 'POST',
                signal: controller.signal
            });

            // Check for "Scan Required" HTML response (which returns 200 OK)
            const startContentType = startRes.headers.get('content-type');
            if (startContentType && startContentType.includes('text/html')) {
                throw new Error('Collection not scanned. Please visit the Web Dashboard to scan your collection first.');
            }

            if (!startRes.ok) {
                const errorText = await startRes.text();
                throw new Error(`Failed to start scan: ${startRes.status} ${errorText}`);
            }

            const startData = await startRes.json();
            if (!startData.success) {
                throw new Error(startData.error || 'Failed to start scan');
            }

            const jobId = startData.jobId;
            logger.log('[Sync] Job started:', jobId);

            // 2. Poll for Status
            let isComplete = false;
            let pollingAttempts = 0;
            let consecutiveFailures = 0;
            const MAX_POLLS = 300; // 5 minutes
            const MAX_CONSECUTIVE_FAILURES = 5;
            let lastUiProgress = 0;
            while (!isComplete && pollingAttempts < MAX_POLLS) {
                // Check cancellation
                if (controller.signal.aborted) throw new Error('Sync cancelled');

                await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1s
                pollingAttempts++;

                const statusUrl = `${CONFIG.API_URL}/collection?mode=scanStatus&jobId=${jobId}`;
                let statusData: any;
                try {
                    const statusRes = await fetch(statusUrl, { signal: controller.signal });

                    if (!statusRes.ok) {
                        consecutiveFailures++;
                        logger.warn(`[Sync] Status poll failed (${statusRes.status}). Failure ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
                        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                            throw new Error(`Sync failed: Too many consecutive errors (${statusRes.status})`);
                        }
                        continue;
                    }

                    consecutiveFailures = 0; // Reset on success
                    statusData = await statusRes.json();

                    // Update progress (0-85% range for scan phase)
                    if (callbacks?.onProgress) {
                        const backendProgress = statusData.progress || 0;
                        const uiProgress = Math.floor(backendProgress * 0.85);
                        if (uiProgress > lastUiProgress) {
                            lastUiProgress = uiProgress;
                            callbacks.onProgress(uiProgress);
                        }
                    }

                    if (statusData.status === 'FAILED') {
                        throw new Error(statusData.error || statusData.message || 'Scan job failed');
                    }

                    if (statusData.status === 'COMPLETED') {
                        isComplete = true;
                        if (CONFIG.DEBUG_WS) logger.log('[Sync] Remote scan complete.');
                    }
                } catch (pollError: any) {
                    // Re-throw if it's an abort, a direct scan failure, or if we hit max failures
                    if (pollError.name === 'AbortError' ||
                        pollError.message === 'Sync cancelled' ||
                        pollError.message.includes('Scan job failed') ||
                        pollError.message === (statusData?.error || statusData?.message)) {
                        throw pollError;
                    }

                    consecutiveFailures++;
                    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) throw pollError;

                    logger.warn(`[Sync] Poll error: ${pollError.message}`);
                }
            }

            if (!isComplete) {
                throw new Error('Sync timed out waiting for backend job');
            }

            // 3. Fetch Resulting Data
            callbacks?.onProgress(85);
            const data = await this.fetchScan(userId);
            callbacks?.onProgress(90); // Data fetched

            if (!data || !data.albums || data.albums.length === 0) {
                throw new Error('Discogs collection empty or user not found');
            }

            // 4. Save to Local DB
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Clearing old data for user:', userId);
            callbacks?.onProgress(92);
            await dbService.clearUserCollection(userId);

            callbacks?.onProgress(95); // Saving releases
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

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Sync cancelled') {
                logger.log('[Sync] Operation cancelled by user');
                return { success: false, error: new Error('Sync cancelled') };
            }
            logger.error('[Sync] Error:', error);
            callbacks?.onStatusChange('error');
            return { success: false, error: error instanceof Error ? error : new Error('Unknown sync error') };
        } finally {
            this.activeSyncs.delete(userId);
            this.abortControllers.delete(userId);
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
            throw error;
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
                spinCount: item.spinCount || 0,
                totalDuration: item.totalDuration || 0
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
     * Fetches the user's daily spin history (recent plays).
     * Maps backend PartyHistoryEntry to Release type.
     */
    public async fetchDailySpin(userId: string): AsyncResult<Release[]> {
        try {
            const url = `${CONFIG.API_URL}/collection?mode=daily-spin&username=${userId}`;
            if (CONFIG.DEBUG_WS) logger.log('[Sync] Fetching daily spin history:', url);

            const response = await fetch(url);

            // Expected for guests/new users
            if (response.status === 404) {
                return { success: true, data: [] };
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.tracks && Array.isArray(data.tracks)) {
                // Map history entries to Release objects
                const historyReleases: Release[] = data.tracks.map((track: any) => ({
                    id: track.releaseId || 0,
                    instanceId: track.releaseId || 0, // History might not preserve instanceId
                    userId: userId,
                    title: track.title || 'Unknown Title',
                    artist: track.artist || 'Unknown Artist',
                    thumb_url: track.coverImage || null,
                    added_at: 0, // Not relevant
                    // Ensure playedAt is a number (ms)
                    playedAt: typeof track.playedAt === 'number' ? track.playedAt : Date.now(),
                    year: '',
                    isNotable: false,
                    isSaved: false,
                    spinCount: track.likeCount || 0 // Reusing spinCount for like count in history view if desired, or 0
                }));

                return { success: true, data: historyReleases };
            }

            return { success: true, data: [] };
        } catch (error) {
            logger.error('[Sync] Failed to fetch daily spin history:', error);
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
