import { syncService } from '../CollectionSyncService';
import { dbService } from '../DatabaseService';
import { useSessionStore } from '../../store/useSessionStore';
import { CONFIG } from '../../config';

// Mock AsyncStorage for Zustand persist
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock DB
jest.mock('../DatabaseService', () => ({
    dbService: {
        saveReleasesBatch: jest.fn(),
        updateReleaseTracks: jest.fn(),
        clearUserCollection: jest.fn().mockResolvedValue(undefined),
    },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('CollectionSyncService', () => {
    const mockUserId = 'test-user';
    let callbacks: any;

    beforeEach(() => {
        jest.clearAllMocks();
        useSessionStore.setState({ syncStatus: 'idle', lastSyncTime: null, syncProgress: 0 });

        callbacks = {
            onProgress: jest.fn((p) => useSessionStore.getState().setSyncProgress(p)),
            onStatusChange: jest.fn((s) => useSessionStore.getState().setSyncStatus(s))
        };
    });

    it('should sync full collection successfully', async () => {
        // Mock Backend Response (Genre-Grouped)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [
                        { releaseId: 101, instance_id: 1, title: 'Album A', artist: 'Band A', coverImage: 'url1', year: '1990', label: 'Label A', format: 'LP' },
                        { releaseId: 102, instance_id: 2, title: 'Album B', artist: 'Band B', coverImage: 'url2', year: '1991' }
                    ],
                    "Jazz": [
                        { releaseId: 103, instance_id: 3, title: 'Album C', artist: 'Band C', coverImage: 'url3', year: '1959' }
                    ]
                },
                totalCount: 3,
                username: mockUserId
            }),
        });

        const result = await syncService.syncCollection(mockUserId, callbacks);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.itemCount).toBe(3);
        }

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            `${CONFIG.API_URL}/collection?format=json&username=${mockUserId}`
        );

        // Should flatten and save all 3 items with metadata
        expect(dbService.saveReleasesBatch).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 101, genres: 'Rock' }),
            expect.objectContaining({ id: 102, genres: 'Rock' }),
            expect.objectContaining({ id: 103, genres: 'Jazz' })
        ]));

        // Verify callback invocations
        expect(callbacks.onStatusChange).toHaveBeenCalledWith('syncing');
        expect(callbacks.onStatusChange).toHaveBeenCalledWith('complete');
        expect(callbacks.onProgress).toHaveBeenCalledWith(100);

        // Verify store updates (via callbacks)
        const state = useSessionStore.getState();
        expect(state.syncStatus).toBe('complete');
        expect(state.syncProgress).toBe(100);
    });

    it('should deduplicate albums and merge genres', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [{ releaseId: 500, instance_id: 5, title: 'Thriller', artist: 'MJ', coverImage: 'url', year: '1982' }],
                    "Pop": [{ releaseId: 500, instance_id: 5, title: 'Thriller', artist: 'MJ', coverImage: 'url', year: '1982' }]
                },
                totalCount: 1,
                username: mockUserId
            }),
        });

        const result = await syncService.syncCollection(mockUserId, callbacks);
        expect(result.success).toBe(true);

        // Should save only 1 item but with merged genres "Rock, Pop"
        const saveCall = (dbService.saveReleasesBatch as jest.Mock).mock.calls[0][0];
        expect(saveCall).toHaveLength(1);
        expect(saveCall[0].genres).toMatch(/Rock/);
        expect(saveCall[0].genres).toMatch(/Pop/);
    });

    it('should map addedTimestamp and isNotable correctly', async () => {
        const mockNow = 1700000000000; // Fixed time
        jest.spyOn(Date, 'now').mockReturnValue(mockNow);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [
                        {
                            releaseId: 600,
                            instance_id: 6,
                            title: 'Notable Item',
                            artist: 'Band',
                            coverImage: 'url',
                            year: '2020',
                            addedTimestamp: 1600000000000, // Explicit timestamp (ms)
                            isNotable: true
                        },
                        {
                            releaseId: 601,
                            instance_id: 7,
                            title: 'Standard Item',
                            artist: 'Band',
                            coverImage: 'url',
                            year: '2021',
                            // No addedTimestamp, should fall back to Date.now()
                            isNotable: false
                        }
                    ],
                },
                totalCount: 2,
                username: mockUserId
            }),
        });

        const result = await syncService.syncCollection(mockUserId, callbacks);
        expect(result.success).toBe(true);

        const saveCall = (dbService.saveReleasesBatch as jest.Mock).mock.calls[0][0];
        expect(saveCall).toHaveLength(2);

        // Verify Notable Item
        const notableItem = saveCall.find((r: Release) => r.id === 600);
        expect(notableItem).toBeDefined();
        expect(notableItem.added_at).toBe(1600000000); // 1600000000000 / 1000
        expect(notableItem.isSaved).toBe(true);

        // Verify Standard Item
        const standardItem = saveCall.find((r: Release) => r.id === 601);
        expect(standardItem).toBeDefined();
        // Since no date provided, it uses Date.now()
        expect(standardItem.added_at).toBe(1700000000); // 1700000000000 / 1000
        expect(standardItem.isSaved).toBe(false);
    });

    it('should detect "Scan Required" HTML response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html; charset=utf-8' },
            json: async () => ({})
        });

        const result = await syncService.syncCollection(mockUserId, callbacks);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.message).toContain('not scanned');
        }

        expect(useSessionStore.getState().syncStatus).toBe('error');
        expect(dbService.saveReleasesBatch).not.toHaveBeenCalled();
    });

    it('should handle API 500 error', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            status: 500
        });

        const result = await syncService.syncCollection(mockUserId, callbacks);
        expect(result.success).toBe(false);

        expect(useSessionStore.getState().syncStatus).toBe('error');
    });

    it('should prevent concurrent syncs for the same user', async () => {
        (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                albums: {
                    "Rock": [{ releaseId: 999, instance_id: 9, title: 'Sync Test', artist: 'Tester', coverImage: 'url', year: '2024' }]
                },
                totalCount: 1,
                username: mockUserId
            })
        }), 100)));

        const sync1 = syncService.syncCollection(mockUserId, callbacks);
        const sync2 = syncService.syncCollection(mockUserId, callbacks);

        const [res1, res2] = await Promise.all([sync1, sync2]);

        expect(res1.success).toBe(true);
        expect(res2.success).toBe(false); // Second one fails immediately
        if (!res2.success) {
            expect(res2.error.message).toContain('already in progress');
        }

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    describe('fetchTracks', () => {
        it('should return success Result with tracks', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    tracks: [{ position: 'A1', title: 'Track 1', duration: '3:00' }]
                }),
            });

            const result = await syncService.fetchTracks(mockUserId, 12345);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].title).toBe('Track 1');
            }
        });

        it('should return error Result on API failure', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await syncService.fetchTracks(mockUserId, 12345);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toContain('API Error: 404');
            }
        });
    });
});
