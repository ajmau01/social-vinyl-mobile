import { syncService } from '../CollectionSyncService';
import { dbService } from '../DatabaseService';
import { useSessionStore } from '../../store/useSessionStore';
import { CONFIG } from '../../config';

// Mock DB
jest.mock('../DatabaseService', () => ({
    dbService: {
        saveReleasesBatch: jest.fn(),
    },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('CollectionSyncService', () => {
    const mockUserId = 'test-user';

    beforeEach(() => {
        jest.clearAllMocks();
        useSessionStore.setState({ syncStatus: 'idle', lastSyncTime: null });
    });

    it('should sync full collection successfully', async () => {
        // Mock Page 1
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ id: 1, title: 'Album 1', artist: 'Artist 1', thumb_url: 'url1', added_at: '2023-01-01' }],
                meta: { total: 2, page: 1, per_page: 1, total_pages: 2 }
            }),
        });

        // Mock Page 2
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ id: 2, title: 'Album 2', artist: 'Artist 2', thumb_url: 'url2', added_at: '2023-01-02' }],
                meta: { total: 2, page: 2, per_page: 1, total_pages: 2 }
            }),
        });

        await syncService.syncCollection(mockUserId);

        expect(global.fetch).toHaveBeenCalledTimes(2);

        // Use regex for URL matching since exact URL depends on constant
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/users/${mockUserId}/collection`));

        expect(dbService.saveReleasesBatch).toHaveBeenCalledTimes(2);

        // Verify store updates
        const state = useSessionStore.getState();
        expect(state.syncStatus).toBe('idle'); // or whatever 'success' state you settled on
        expect(state.lastSyncTime).not.toBeNull();
    });

    it('should handle API error gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        await syncService.syncCollection(mockUserId);

        const state = useSessionStore.getState();
        expect(state.syncStatus).toBe('error');
        expect(dbService.saveReleasesBatch).not.toHaveBeenCalled();
    });
});
