import { wsService } from './WebSocketService';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Release, Result, BinItem } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { logger } from '@/utils/logger';

class ListeningBinSyncService {
    private static instance: ListeningBinSyncService;
    private initialized = false;

    private constructor() { }

    public static getInstance(): ListeningBinSyncService {
        if (!ListeningBinSyncService.instance) {
            ListeningBinSyncService.instance = new ListeningBinSyncService();
        }
        return ListeningBinSyncService.instance;
    }

    public init() {
        if (this.initialized) return;

        logger.log('[BinSync] Initializing Service');

        // Register for bin state updates
        wsService.addBinStateListener(this.handleBinState.bind(this));

        this.initialized = true;
    }

    /**
     * Handles incoming bin state from server
     */
    private handleBinState(items: BinItem[]) {
        logger.log('[BinSync] Received bin state update. Items:', items?.length || 0);
        if (items && items.length > 0) {
            logger.log('[BinSync] First item:', JSON.stringify(items[0]));
        }

        const { setBin } = useListeningBinStore.getState();

        // Map backend items to frontend structure
        // CRITICAL: Ensure we have a unique key for the UI list
        // Backend currently only sends releaseId, which causes duplicate key errors
        // if the same album is added twice.
        const syncedItems = items.map((item, index) => {
            // Ensure we have a valid ID for frontend components
            const releaseId = item.id || item.releaseId || 0;

            return {
                ...item,
                id: releaseId,
                status: 'synced' as const,
                // Issue #126: Map backend coverImage to frontend thumb_url
                thumb_url: item.coverImage || item.thumb_url || null,
                // Use instanceId if available, otherwise generate a stable unique key
                // combining releaseId, timestamp, and index to guarantee uniqueness
                frontendId: item.instanceId
                    ? item.instanceId.toString()
                    : `${releaseId}-${item.addedTimestamp}-${index}`
            };
        });

        logger.log('[BinSync] Updating store with', syncedItems.length, 'items');
        setBin(syncedItems);
    }

    /**
     * Adds an album to the bin with optimistic update
     */
    public async addAlbum(release: Release): Promise<Result<void>> {
        const { username: userId } = useSessionStore.getState();
        const { addAlbumOptimistic, confirmAdd, revertAdd } = useListeningBinStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };

        const tempId = generateUUID();

        // 1. Optimistic Update
        addAlbumOptimistic(release, userId, tempId);

        try {
            // 2. Send Action
            // Payload should match what backend expects for 'add' action
            const result = await wsService.sendAction<{ success: boolean, releaseId: number, addedTimestamp: number }>('add', {
                releaseId: release.id,
                instanceId: release.instanceId
            });

            // 3. Confirm success
            confirmAdd(tempId, result.releaseId, result.addedTimestamp);
            return { success: true, data: undefined };

        } catch (error) {
            logger.error('[BinSync] Add album failed', error);
            // 4. Revert on failure
            revertAdd(tempId);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Removes an album from the bin with optimistic update
     */
    public async removeAlbum(releaseId: number): Promise<Result<void>> {
        const { username: userId } = useSessionStore.getState();
        const { removeAlbumOptimistic, items, revertRemove } = useListeningBinStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };

        // Output for revert if needed
        const itemToRemove = items.find(i => i.id === releaseId && i.userId === userId);
        if (!itemToRemove) return { success: false, error: new Error('Item not found in bin') };

        // 1. Optimistic Update
        removeAlbumOptimistic(releaseId, userId);

        try {
            // 2. Send Action
            await wsService.sendAction('remove', {
                releaseId: releaseId
            });

            // 3. Success (no specific confirm action needed as state is already gone)
            return { success: true, data: undefined };

        } catch (error) {
            logger.error('[BinSync] Remove album failed', error);
            // 4. Revert on failure
            revertRemove(itemToRemove, userId, itemToRemove.addedTimestamp);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Reorders albums in the bin
     */
    public async reorderAlbums(releaseIds: number[]): Promise<Result<void>> {
        // Optimistic reorder is handled by UI/Store directly before calling this
        // So we just send the new order

        try {
            await wsService.sendAction('reorder', {
                releaseIds
            });
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] Reorder failed', error);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Clears all albums from the bin
     */
    public async clearBin(): Promise<Result<void>> {
        const { username: userId } = useSessionStore.getState();

        // No optimistic update for clear yet, relying on server state push
        // to avoid complex revert logic for many items. 
        // Could implement optimistic clear if needed for responsiveness.

        try {
            await wsService.sendAction('clear-bin', {});
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] Clear bin failed', error);
            return { success: false, error: error as Error };
        }
    }
}

export const listeningBinSyncService = ListeningBinSyncService.getInstance();
