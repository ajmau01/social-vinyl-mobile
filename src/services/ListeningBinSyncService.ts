// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { wsService } from './WebSocketService';
import { WS_ACTIONS } from './wsActions';
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
    private handleBinState({ items, hostUsername }: { items: BinItem[], hostUsername?: string }) {
        if (!items) {
            return;
        }

        if (hostUsername) {
            useSessionStore.getState().setHostUsername(hostUsername);
        }

        const { setBin } = useListeningBinStore.getState();

        // Map backend items to frontend structure
        // CRITICAL: Ensure we have a unique key for the UI list
        // Backend currently only sends releaseId, which causes duplicate key errors
        // if the same album is added twice.
        const syncedItems = items.map((item, index) => {
            // Priority: instanceId > database id > releaseId
            const id = item.instanceId || item.id || item.releaseId || 0;

            return {
                ...item,
                id: id,
                status: 'synced' as const,
                // Map backend requestedBy to userId so isInBin works correctly
                userId: item.userId || item.requestedBy || (() => {
                    logger.warn('[BinSync] Item missing userId and requestedBy — bin ownership checks may fail', item.releaseId);
                    return '';
                })(),
                // Issue #126: Map backend coverImage to frontend thumb_url
                thumb_url: item.coverImage || item.thumb_url || null,
                // Use instanceId as frontendId for stability
                frontendId: item.instanceId
                    ? item.instanceId.toString()
                    : `${item.releaseId}-${item.addedTimestamp}-${index}`,
                // Explicit mapping — backend broadcasts this for ownership verification on remove
                clientUUID: item.clientUUID
            };
        });

        logger.log('[BinSync] Updating store with', syncedItems.length, 'items');
        setBin(syncedItems);
    }

    /**
     * Adds an album to the bin with optimistic update
     */
    public async addAlbum(release: Release): Promise<Result<void>> {
        const { username, displayName } = useSessionStore.getState();
        const userId = username || displayName;
        const { addAlbumOptimistic, confirmAdd, revertAdd } = useListeningBinStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };

        const tempId = generateUUID();

        // 1. Optimistic Update
        addAlbumOptimistic(release, userId, tempId);

        try {
            // 2. Send Action
            // Payload MUST match backend expectations (wrapped in "album" object)
            const result = await wsService.sendAction<{
                success: boolean,
                releaseId: number,
                addedTimestamp: number,
                instanceId?: number
            }>(WS_ACTIONS.ADD, {
                album: {
                    releaseId: release.id,
                    masterId: 0, // Not currently available on mobile Release type
                    title: release.title,
                    artist: release.artist,
                    year: release.year || '',
                    format: release.format || '',
                    label: release.label || '',
                    coverImage: release.thumb_url || '',
                    totalDuration: release.totalDuration || 0,
                },
                clientUUID: tempId,
                displayName: userId
            });

            // 3. Confirm success
            // Guard: some server configurations (e.g. guest sessions) ACK success
            // without returning data. Fall back to release.id so the optimistic
            // entry is confirmed rather than reverted.
            if (result) {
                confirmAdd(tempId, result.releaseId, result.addedTimestamp, result.instanceId);
            } else {
                confirmAdd(tempId, release.id, Date.now(), undefined);
            }
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
        const { username, displayName, sessionRole } = useSessionStore.getState();
        const callerUserId = username || displayName;
        const { removeAlbumOptimistic, items, revertRemove } = useListeningBinStore.getState();

        if (!callerUserId) return { success: false, error: new Error('User not logged in') };

        // Find item by id. Hosts can remove any item; guests/others only their own.
        // Note: callers should pass item.id, not the Discogs release ID, since after
        // confirmAdd item.id is set to instanceId.
        const itemToRemove = sessionRole === 'host'
            ? items.find(i => i.id === releaseId || i.releaseId === releaseId)
            : items.find(i => (i.id === releaseId || i.releaseId === releaseId) && i.userId === callerUserId);
        if (!itemToRemove) return { success: false, error: new Error('Item not found in bin') };

        // Use the item's own userId for store scoping (host may be removing a guest's item).
        // Use != null (not ||) to preserve empty string userId for items whose owner resolved to "".
        const userId = itemToRemove.userId != null ? itemToRemove.userId : callerUserId;

        // 1. Optimistic Update
        removeAlbumOptimistic(releaseId, userId);

        try {
            // 2. Send Action
            await wsService.sendAction(WS_ACTIONS.REMOVE, {
                releaseId: itemToRemove.releaseId,
                instanceId: itemToRemove.instanceId,
                // clientUUID is set from bin-state sync; fall back to tempId for items
                // that are still optimistic (added but bin-state not yet received)
                clientUUID: itemToRemove.clientUUID || itemToRemove.tempId
            });

            // 3. Success (no specific confirm action needed as state is already gone)
            return { success: true, data: undefined };

        } catch (error) {
            logger.error('[BinSync] Remove album failed', error);
            // On timeout: the remove may have succeeded but the ACK was lost (e.g. tunnel
            // dropped the session after broadcastBinState). Check if bin-state already
            // reflects the removal — if item is gone, don't revert.
            const isTimeout = (error as Error).message?.includes('timed out');
            if (isTimeout) {
                const { items: currentItems } = useListeningBinStore.getState();
                const stillInStore = currentItems.some(
                    i => (i.id === releaseId || i.releaseId === releaseId) && i.userId === userId
                );
                if (stillInStore) {
                    revertRemove(itemToRemove, userId, itemToRemove.addedTimestamp);
                }
            } else {
                revertRemove(itemToRemove, userId, itemToRemove.addedTimestamp);
            }
            return { success: false, error: error as Error };
        }
    }

    /**
     * Reorders albums in the bin
     */
    public async reorderAlbums(ids: number[]): Promise<Result<void>> {
        // Optimistic reorder is handled by UI/Store directly before calling this
        // So we just send the new order

        try {
            await wsService.sendAction(WS_ACTIONS.REORDER, {
                instanceIds: ids
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
        // No optimistic update for clear yet, relying on server state push
        // to avoid complex revert logic for many items. 
        // Could implement optimistic clear if needed for responsiveness.

        try {
            await wsService.sendAction(WS_ACTIONS.CLEAR, {});
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] Clear bin failed', error);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Toggles like state for the currently playing album
     */
    public async likeCurrentAlbum(): Promise<Result<void>> {
        const { nowPlaying, setNowPlaying } = useSessionStore.getState();
        if (!nowPlaying || !nowPlaying.releaseId) {
            return { success: false, error: new Error('Nothing playing') };
        }

        const currentlyLiked = !!nowPlaying.userHasLiked;
        const newLikeState = !currentlyLiked;
        const action = newLikeState ? WS_ACTIONS.LIKE : WS_ACTIONS.UNLIKE;

        // 1. Optimistic Update
        const originalNP = { ...nowPlaying };
        setNowPlaying({
            ...nowPlaying,
            userHasLiked: newLikeState
        });

        try {
            // 2. Send Action
            await wsService.sendAction(action, {
                releaseId: parseInt(nowPlaying.releaseId, 10)
            });

            // 3. Success (Server will broadcast the updated likeCount soon)
            return { success: true, data: undefined };

        } catch (error) {
            logger.error(`[BinSync] ${action} failed`, error);
            setNowPlaying(originalNP);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Plays an album from the bin (Host only)
     */
    public async playAlbum(album: Release | BinItem): Promise<Result<void>> {
        const { username: userId, hostUsername } = useSessionStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };
        if (userId !== hostUsername) return { success: false, error: new Error('Only the host can play albums') };

        // Ensure we have a valid ID
        // IMPORTANT: Prefer album.releaseId (Discogs ID) over album.id.
        // After confirmAdd, album.id is set to instanceId (a DB row ID like 1601),
        // not the Discogs release ID (like 9173990). Using album.id first would
        // cause the server to fail to find and remove the item from the queue.
        const releaseId = album.releaseId || album.id;
        if (!releaseId) return { success: false, error: new Error('Invalid album ID') };

        try {
            await wsService.sendAction(WS_ACTIONS.PLAY_ALBUM, {
                album: {
                    releaseId: Number(releaseId),
                    instanceId: album.instanceId || undefined,
                    title: album.title,
                    artist: album.artist,
                    coverImage: album.thumb_url || album.coverImage,
                    year: String(album.year || ''),
                    totalDuration: album.totalDuration || 0
                }
            });
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] Play album failed', error);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Stops current playback (Host only)
     */
    public async stopPlayback(): Promise<Result<void>> {
        const { username: userId, hostUsername } = useSessionStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };
        if (userId !== hostUsername) return { success: false, error: new Error('Only the host can stop playback') };

        try {
            await wsService.sendAction(WS_ACTIONS.STOP_PLAYBACK, {});
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] Stop playback failed', error);
            return { success: false, error: error as Error };
        }
    }

    /**
     * Ends the current session (Host only)
     */
    public async endSession(): Promise<Result<void>> {
        const { username: userId, hostUsername } = useSessionStore.getState();

        if (!userId) return { success: false, error: new Error('User not logged in') };
        if (userId !== hostUsername) return { success: false, error: new Error('Only the host can end sessions') };

        try {
            await wsService.sendAction(WS_ACTIONS.ARCHIVE, {});
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('[BinSync] End session failed', error);
            return { success: false, error: error as Error };
        }
    }
}

export const listeningBinSyncService = ListeningBinSyncService.getInstance();
