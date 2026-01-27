import { useSessionStore } from '../store/useSessionStore';
import { dbService, Release } from './DatabaseService';
import { CONFIG } from '../config';

interface CollectionResponse {
    items: {
        id: number;
        title: string;
        artist: string;
        thumb_url: string;
        // API might return other fields, mapped to added_at later or if API provides it
        // Assuming API returns 'added_at' or we use current time for now if missing
        added_at?: number;
    }[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

class CollectionSyncService {
    private isSyncing = false;

    public async syncCollection(userId: string) {
        if (this.isSyncing) return;
        this.isSyncing = true;
        useSessionStore.getState().setSyncStatus('syncing');

        try {
            let page = 1;
            let totalPages = 1;

            // TODO: In future, get lastSyncTime to optimized fetch
            // For now, full sync or simple pagination loop

            console.log('[Sync] Starting sync for user:', userId);

            // Fetch first page to get metadata
            const firstPage = await this.fetchPage(userId, page);
            if (!firstPage) throw new Error('Failed to fetch first page');

            totalPages = firstPage.meta.total_pages;
            await this.savePage(firstPage.items);

            // Fetch remaining pages
            while (page < totalPages) {
                page++;
                const nextPage = await this.fetchPage(userId, page);
                if (nextPage) {
                    await this.savePage(nextPage.items);
                }
            }

            console.log('[Sync] Complete');
            useSessionStore.getState().setSyncStatus('idle'); // Or 'success' if we want detailed state
            useSessionStore.getState().setLastSyncTime(Date.now());

        } catch (error) {
            console.error('[Sync] Error:', error);
            useSessionStore.getState().setSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    private async fetchPage(userId: string, page: number): Promise<CollectionResponse | null> {
        try {
            // NOTE: Adjust API endpoint endpoint schema as per actual backend implementation
            const url = `${CONFIG.API_URL}/api/v1/users/${userId}/collection?page=${page}&per_page=50`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[Sync] Failed to fetch page ${page}`, error);
            return null;
        }
    }

    private async savePage(items: any[]) {
        const releases: Release[] = items.map(item => ({
            id: item.id,
            title: item.title,
            artist: item.artist,
            thumb_url: item.thumb_url || item.thumb || null,
            added_at: item.added_at ? new Date(item.added_at).getTime() : Date.now() // Fallback
        }));

        await dbService.saveReleasesBatch(releases);
    }
}

export const syncService = new CollectionSyncService();
