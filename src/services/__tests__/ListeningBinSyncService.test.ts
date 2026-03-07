// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { listeningBinSyncService } from '../ListeningBinSyncService';
import { wsService } from '../WebSocketService';
import { WS_ACTIONS } from '../wsActions';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Release, BinItem } from '@/types';

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

    beforeEach(() => {
        jest.clearAllMocks();
        (useListeningBinStore.getState as jest.Mock).mockReturnValue(mockActions);
        (useSessionStore.getState as jest.Mock).mockReturnValue({ username: 'testuser' });
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
