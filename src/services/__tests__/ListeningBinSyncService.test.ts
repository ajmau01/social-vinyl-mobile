import { listeningBinSyncService } from '../ListeningBinSyncService';
import { wsService } from '../WebSocketService';
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
        year: 2024,
        thumb_url: '',
        folder_id: 1,
        added_at: 12345
    };

    const mockActions = {
        addTrackOptimistic: jest.fn(),
        confirmAdd: jest.fn(),
        revertAdd: jest.fn(),
        removeTrackOptimistic: jest.fn(),
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

    it('should add track successfully', async () => {
        (wsService.sendAction as jest.Mock).mockResolvedValue({
            success: true,
            releaseId: 1,
            addedTimestamp: 1234567890
        });

        const result = await listeningBinSyncService.addTrack(mockRelease);

        expect(result.success).toBe(true);
        expect(mockActions.addTrackOptimistic).toHaveBeenCalledWith(mockRelease, 'testuser', expect.any(String));
        expect(wsService.sendAction).toHaveBeenCalledWith('add-track', expect.objectContaining({
            releaseId: 1,
            instanceId: 101
        }));
        expect(mockActions.confirmAdd).toHaveBeenCalledWith(expect.any(String), 1, 1234567890);
    });

    it('should revert add track on failure', async () => {
        (wsService.sendAction as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await listeningBinSyncService.addTrack(mockRelease);

        expect(result.success).toBe(false);
        expect(mockActions.addTrackOptimistic).toHaveBeenCalled();
        expect(mockActions.revertAdd).toHaveBeenCalledWith(expect.any(String));
    });

    it('should remove track successfully', async () => {
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

        const result = await listeningBinSyncService.removeTrack(1);

        expect(result.success).toBe(true);
        expect(mockActions.removeTrackOptimistic).toHaveBeenCalledWith(1, 'testuser');
        expect(wsService.sendAction).toHaveBeenCalledWith('remove-track', { releaseId: 1 });
    });
});
