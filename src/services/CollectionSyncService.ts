import { useSessionStore } from '../store/useSessionStore';
import { dbService, Release } from './DatabaseService';
import { CONFIG } from '../config';

interface BackendAlbum {
    releaseId: number;
    title: string;
    artist: string;
    coverImage: string;
    year?: string;
    // ... other fields provided by backend
}

interface ScanResponse {
    albums: BackendAlbum[];
    count: number;
    username: string;
}

class CollectionSyncService {
    private isSyncing = false;

    public async syncCollection(userId: string) {
        if (this.isSyncing) return;
        this.isSyncing = true;
        useSessionStore.getState().setSyncStatus('syncing');
        useSessionStore.getState().setSyncProgress(10); // Started

        try {
            console.log('[Sync] Starting sync for user:', userId);

            // Fetch cached data (Read-Only)
            const data = await this.fetchScan(userId);

            if (!data || !data.albums) {
                // If fetchScan threw (e.g. Not Scanned), it might be caught there.
                // If it returned null, we throw generic.
                throw new Error('Failed to fetch collection');
            }

            useSessionStore.getState().setSyncProgress(50); // Downloaded

            await this.saveReleases(data.albums);

            console.log('[Sync] Complete. Items:', data.albums.length);
            useSessionStore.getState().setSyncStatus('success');
            useSessionStore.getState().setSyncProgress(100);
            useSessionStore.getState().setLastSyncTime(Date.now());

        } catch (error) {
            console.error('[Sync] Error:', error);
            useSessionStore.getState().setSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    private async fetchScan(userId: string): Promise<ScanResponse | null> {
        try {
            // Use format=json to get cached collection (Read-Only)
            // mode=scan is restricted to the host machine (403 Forbidden)
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
            // Albums with multiple genres appear in multiple categories
            if (rawData && rawData.albums && !Array.isArray(rawData.albums)) {
                const allAlbums = Object.values(rawData.albums).flat() as BackendAlbum[];

                // Deduplicate by releaseId
                const uniqueAlbumsMap = new Map<number, BackendAlbum>();
                for (const album of allAlbums) {
                    if (!uniqueAlbumsMap.has(album.releaseId)) {
                        uniqueAlbumsMap.set(album.releaseId, album);
                    }
                }

                const flatAlbums = Array.from(uniqueAlbumsMap.values());

                return {
                    albums: flatAlbums,
                    count: flatAlbums.length, // Update count to match unique items
                    username: rawData.username || userId
                };
            }

            return rawData;
        } catch (error) {
            console.error(`[Sync] Failed to fetch collection`, error);
            // Re-throw if it's our specific "Not Scanned" error so the UI can show it
            if (error instanceof Error && error.message.includes('not scanned')) {
                throw error;
            }
            return null;
        }
    }

    private async saveReleases(items: BackendAlbum[]) {
        const releases: Release[] = items.map((item, index) => ({
            id: item.releaseId,
            title: item.title,
            artist: item.artist,
            thumb_url: item.coverImage || null,
            // Preserve relative order by offsetting timestamp
            // Newer items (index 0) get higher timestamp
            added_at: Date.now() - index
        }));

        await dbService.saveReleasesBatch(releases);
    }
}

export const syncService = new CollectionSyncService();
