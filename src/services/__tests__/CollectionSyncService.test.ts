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
        // Mock Backend Response (Genre-Grouped)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [
                        { releaseId: 101, title: 'Album A', artist: 'Band A', coverImage: 'url1' },
                        { releaseId: 102, title: 'Album B', artist: 'Band B', coverImage: 'url2' }
                    ],
                    "Jazz": [
                        { releaseId: 103, title: 'Album C', artist: 'Band C', coverImage: 'url3' }
                    ]
                },
                totalCount: 3,
                username: mockUserId
            }),
        });

        await syncService.syncCollection(mockUserId);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            `${CONFIG.API_URL}/collection?format=json&username=${mockUserId}`
        );

        // Should flatten and save all 3 items
        expect(dbService.saveReleasesBatch).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 101, title: 'Album A' }),
            expect.objectContaining({ id: 102, title: 'Album B' }),
            expect.objectContaining({ id: 103, title: 'Album C' })
        ]));

        // Verify store updates
        const state = useSessionStore.getState();
        expect(state.syncStatus).toBe('success');
        expect(state.syncProgress).toBe(100);
        expect(state.lastSyncTime).not.toBeNull();
    });

    it('should deduplicate albums appearing in multiple genres', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [{ releaseId: 500, title: 'Thriller', artist: 'MJ', coverImage: 'url' }],
                    "Pop": [{ releaseId: 500, title: 'Thriller', artist: 'MJ', coverImage: 'url' }]
                },
                totalCount: 1, // Logic should derive real count from deduped list
                username: mockUserId
            }),
        });

        await syncService.syncCollection(mockUserId);

        // Should save only 1 item
        const saveCall = (dbService.saveReleasesBatch as jest.Mock).mock.calls[0][0];
        expect(saveCall).toHaveLength(1);
        expect(saveCall[0].id).toBe(500);
    });

    it('should detect "Scan Required" HTML response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html; charset=utf-8' },
            // Body doesn't matter, header check comes first
            json: async () => ({})
        });

        await syncService.syncCollection(mockUserId);

        const state = useSessionStore.getState();
        // Since we swallow the error in syncCollection but log it, status should be 'error'
        expect(state.syncStatus).toBe('error');
        expect(dbService.saveReleasesBatch).not.toHaveBeenCalled();
    });

    it('should handle API 500 error', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            status: 500
        });

        await syncService.syncCollection(mockUserId);

        const state = useSessionStore.getState();
        expect(state.syncStatus).toBe('error');
        expect(dbService.saveReleasesBatch).not.toHaveBeenCalled();
    });

    it('should prevent concurrent syncs', async () => {
        // Mock a slow fetch
        (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ albums: {} })
        }), 100)));

        const sync1 = syncService.syncCollection(mockUserId);
        const sync2 = syncService.syncCollection(mockUserId);

        await Promise.all([sync1, sync2]);

        // Should only be called once
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
