import { dbService } from './DatabaseService';
import {
    Release,
    SyncCallbacks,
    AsyncResult,
    SyncResult
} from '@/types';
import { CONFIG } from '../config';

interface BackendAlbum {
    releaseId: number;
    title: string;
    artist: string;
    coverImage: string;
    year?: string;
    label?: string;
    format?: string;
    tracks?: any[]; // Raw track objects
    genres?: string[]; // We will inject this during flattening
}

interface ScanResponse {
    albums: BackendAlbum[];
    count: number;
    username: string;
    avatarUrl?: string;
}

class CollectionSyncService {
    private activeSyncs = new Set<string>();

    public async syncCollection(userId: string, callbacks?: SyncCallbacks): AsyncResult<SyncResult> {
        if (this.activeSyncs.has(userId)) {
            return { success: false, error: new Error('Sync already in progress for this user') };
        }

        this.activeSyncs.add(userId);
        callbacks?.onStatusChange('syncing');
        callbacks?.onProgress(10); // Started

        try {
            console.log('[Sync] Starting sync for user:', userId);

            // Fetch cached data (Read-Only)
            const data = await this.fetchScan(userId);

            if (!data || !data.albums || data.albums.length === 0) {
                throw new Error('Discogs collection is empty or user not found');
            }

            callbacks?.onProgress(50); // Downloaded

            await this.saveReleases(data.albums, userId);

            console.log('[Sync] Complete. Items:', data.albums.length);
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
            console.error('[Sync] Error:', error);
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
            console.log('[Sync] Fetching:', url);

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
            // We need to flatten this into a single list AND deduplicate
            if (rawData && rawData.albums && !Array.isArray(rawData.albums)) {
                const uniqueAlbumsMap = new Map<number, BackendAlbum>();

                for (const [category, albums] of Object.entries(rawData.albums)) {
                    const albumList = albums as BackendAlbum[];
                    for (const album of albumList) {
                        if (!uniqueAlbumsMap.has(album.releaseId)) {
                            uniqueAlbumsMap.set(album.releaseId, { ...album, genres: [category] });
                        } else {
                            const existing = uniqueAlbumsMap.get(album.releaseId)!;
                            if (existing.genres && !existing.genres.includes(category)) {
                                existing.genres.push(category);
                            }
                        }
                    }
                }

                const flatAlbums = Array.from(uniqueAlbumsMap.values());

                return {
                    albums: flatAlbums,
                    count: flatAlbums.length,
                    username: rawData.username || userId,
                    avatarUrl: rawData.avatarUrl
                };
            }

            return rawData;
        } catch (error) {
            console.error(`[Sync] Failed to fetch collection`, error);
            if (error instanceof Error && error.message.includes('not scanned')) {
                throw error;
            }
            return null;
        }
    }

    private async saveReleases(items: BackendAlbum[], userId: string) {
        const releases: Release[] = items.map((item, index) => ({
            id: item.releaseId,
            userId: userId,
            title: item.title,
            artist: item.artist,
            thumb_url: item.coverImage || null,
            added_at: Date.now() - index,
            year: item.year,
            genres: item.genres ? item.genres.join(', ') : undefined,
            label: item.label,
            format: item.format,
            tracks: item.tracks ? JSON.stringify(item.tracks) : undefined
        }));

        await dbService.saveReleasesBatch(releases);
    }

    public async fetchTracks(userId: string, releaseId: number): Promise<any[] | null> {
        try {
            const url = `${CONFIG.API_URL}/collection?mode=tracklist&releaseId=${releaseId}`;
            console.log('[Sync] Fetching tracks:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();

            if (data && data.tracks) {
                if (userId) {
                    await dbService.updateReleaseTracks(userId, releaseId, JSON.stringify(data.tracks));
                }
                return data.tracks;
            }
            return null;
        } catch (error) {
            console.error('[Sync] Failed to fetch tracks:', error);
            return null;
        }
    }
}

export const syncService = new CollectionSyncService();
