// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { listeningBinSyncService } from '../ListeningBinSyncService';
import { wsService } from '../WebSocketService';
import { WS_ACTIONS } from '../wsActions';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Release, BinItem } from '@/types';
import { WS_ACTIONS } from '../wsActions';

// Mock Dependencies
jest.mock('../WebSocketService', () => ({
    wsService: {
        sendAction: jest.fn(),
        addBinStateListener: jest.fn(),
    }
}));

jest.mock('@/store/useListeningBinStore', () => ({
    useListeningBinStore: {
        getState: jest.fn(),
    }
}));

jest.mock('@/store/useSessionStore', () => ({
    useSessionStore: {
        getState: jest.fn(),
    }
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        log: jest.fn(),
        error: jest.fn(),
    }
}));

describe('ListeningBinSyncService', () => {
    const mockRelease: Release = {
        id: 1,
        instanceId: 101,
        userId: 'testuser',
        title: 'Test Album',
        artist: 'Test Artist',
        year: '2024',
        thumb_url: '',
        added_at: 12345
    };

    const mockActions = {
        addAlbumOptimistic: jest.fn(),
        confirmAdd: jest.fn(),
        revertAdd: jest.fn(),
        removeAlbumOptimistic: jest.fn(),
        confirmRemove: jest.fn(),
        revertRemove: jest.fn(),
        setBin: jest.fn(),
        items: [] as BinItem[]
    };

    const mockBinItem: BinItem = {
        ...mockRelease,
        id: 1601,          // instanceId after confirmAdd
        releaseId: 9999,   // Discogs release ID
        userId: 'user1',
        addedTimestamp: 0,
        status: 'synced',
        instanceId: 1601,
        clientUUID: 'test-client-uuid',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useListeningBinStore.getState as jest.Mock).mockReturnValue(mockActions);
        (useSessionStore.getState as jest.Mock).mockReturnValue({ username: 'testuser' });
    });

    // ────────────────────────────────────────────────────────────
    // Test 1: clearBin sends the correct WS action name
    // Regression: 'clear-bin' was shipped; backend expects 'clear'
    // ────────────────────────────────────────────────────────────
    it('clearBin sends action WS_ACTIONS.CLEAR', async () => {
        (wsService.sendAction as jest.Mock).mockResolvedValue(undefined);

        await listeningBinSyncService.clearBin();

        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.CLEAR, expect.anything());
    });

    // ────────────────────────────────────────────────────────────
    // Test 3: Host can remove a guest's item by item.id
    // Regression: host lookup was userId-gated, blocking host removes
    // ────────────────────────────────────────────────────────────
    it('host removeAlbum removes a guest item regardless of userId', async () => {
        const removeAlbumOptimistic = jest.fn();
        const revertRemove = jest.fn();
        const guestItem: BinItem = {
            ...mockBinItem,
            userId: 'Guest-1234',
        };

        (useListeningBinStore.getState as jest.Mock).mockReturnValue({
            ...mockActions,
            items: [guestItem],
            removeAlbumOptimistic,
            revertRemove,
        });
        (useSessionStore.getState as jest.Mock).mockReturnValue({
            username: 'hostUser',
            displayName: null,
            sessionRole: 'host',
        });
        (wsService.sendAction as jest.Mock).mockResolvedValue({});

        const result = await listeningBinSyncService.removeAlbum(1601);

        expect(result.success).toBe(true);
        // Optimistic remove scoped to guest's userId (not host's)
        expect(removeAlbumOptimistic).toHaveBeenCalledWith(1601, 'Guest-1234');
        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.REMOVE, expect.objectContaining({
            releaseId: 9999,
        }));
    });

    // ────────────────────────────────────────────────────────────
    // Test 4: removeAlbum includes clientUUID in the WS payload
    // Regression: backend uses clientUUID for ownership verification
    // ────────────────────────────────────────────────────────────
    it('removeAlbum sends clientUUID in the remove payload', async () => {
        (useListeningBinStore.getState as jest.Mock).mockReturnValue({
            ...mockActions,
            items: [mockBinItem],
            removeAlbumOptimistic: jest.fn(),
            revertRemove: jest.fn(),
        });
        (useSessionStore.getState as jest.Mock).mockReturnValue({
            username: 'user1',
            displayName: null,
            sessionRole: 'guest',
        });
        (wsService.sendAction as jest.Mock).mockResolvedValue({});

        await listeningBinSyncService.removeAlbum(1601);

        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.REMOVE, expect.objectContaining({
            clientUUID: 'test-client-uuid',
        }));
    });

    // ────────────────────────────────────────────────────────────
    // Test 5: Timeout recovery — do NOT revert if item already gone
    // Regression: single-branch stillInStore check missed items by Discogs ID
    // Scenario: optimistic remove cleared it; bin-state confirmed it; ACK timed out
    // ────────────────────────────────────────────────────────────
    it('does not revert on timeout if bin-state already removed the item', async () => {
        const revertRemove = jest.fn();
        const removeAlbumOptimistic = jest.fn();

        // First getState(): item is in store (for initial lookup + optimistic remove)
        // Second getState(): item is gone (bin-state sync arrived and cleared it)
        (useListeningBinStore.getState as jest.Mock)
            .mockReturnValueOnce({
                ...mockActions,
                items: [mockBinItem],
                removeAlbumOptimistic,
                revertRemove,
            })
            .mockReturnValue({
                ...mockActions,
                items: [],   // bin-state has already cleared the item
                removeAlbumOptimistic,
                revertRemove,
            });

        (useSessionStore.getState as jest.Mock).mockReturnValue({
            username: 'user1',
            displayName: null,
            sessionRole: 'guest',
        });
        (wsService.sendAction as jest.Mock).mockRejectedValue(new Error('Action remove timed out'));

        await listeningBinSyncService.removeAlbum(1601);

        // Item is already gone — should NOT revert
        expect(revertRemove).not.toHaveBeenCalled();
    });

    it('should add album successfully', async () => {
        (wsService.sendAction as jest.Mock).mockResolvedValue({
            success: true,
            releaseId: 1,
            addedTimestamp: 1234567890
        });

        const result = await listeningBinSyncService.addAlbum(mockRelease);

        expect(result.success).toBe(true);
        expect(mockActions.addAlbumOptimistic).toHaveBeenCalledWith(mockRelease, 'testuser', expect.any(String));
        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.ADD, expect.objectContaining({
            album: expect.objectContaining({
                releaseId: 1,
                title: 'Test Album',
                artist: 'Test Artist',
            }),
            displayName: 'testuser',
        }));
        expect(mockActions.confirmAdd).toHaveBeenCalledWith(expect.any(String), 1, 1234567890, undefined);
    });

    it('should revert add album on failure', async () => {
        (wsService.sendAction as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await listeningBinSyncService.addAlbum(mockRelease);

        expect(result.success).toBe(false);
        expect(mockActions.addAlbumOptimistic).toHaveBeenCalled();
        expect(mockActions.revertAdd).toHaveBeenCalledWith(expect.any(String));
    });

    it('should remove album successfully', async () => {
        const mockItem: BinItem = {
            ...mockRelease,
            userId: 'testuser',
            addedTimestamp: 1000,
            status: 'synced'
        };

        (useListeningBinStore.getState as jest.Mock).mockReturnValue({
            ...mockActions,
            items: [mockItem]
        });
        (wsService.sendAction as jest.Mock).mockResolvedValue({});

        const result = await listeningBinSyncService.removeAlbum(1);

        expect(result.success).toBe(true);
        expect(mockActions.removeAlbumOptimistic).toHaveBeenCalledWith(1, 'testuser');
        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.REMOVE, expect.objectContaining({
            instanceId: 101,
        }));
    });

    it('should revert remove album on failure', async () => {
        const mockItem: BinItem = {
            ...mockRelease,
            userId: 'testuser',
            addedTimestamp: 1000,
            status: 'synced'
        };

        (useListeningBinStore.getState as jest.Mock).mockReturnValue({
            ...mockActions,
            items: [mockItem]
        });
        (wsService.sendAction as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await listeningBinSyncService.removeAlbum(1);

        expect(result.success).toBe(false);
        expect(mockActions.removeAlbumOptimistic).toHaveBeenCalled();
        expect(mockActions.revertRemove).toHaveBeenCalledWith(mockItem, 'testuser', 1000);
    });

    it('should reorder albums successfully', async () => {
        (wsService.sendAction as jest.Mock).mockResolvedValue({});

        const result = await listeningBinSyncService.reorderAlbums([1, 2, 3]);

        expect(result.success).toBe(true);
        expect(wsService.sendAction).toHaveBeenCalledWith(WS_ACTIONS.REORDER, {
            instanceIds: [1, 2, 3]
        });
    });
});
