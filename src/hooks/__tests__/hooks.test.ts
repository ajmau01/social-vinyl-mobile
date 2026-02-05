import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '../useWebSocket';
import { useSyncCollection } from '../useSyncCollection';
import { useCollectionData } from '../useCollectionData';
import { useGroupedReleases } from '../useGroupedReleases';
import { wsService } from '@/services/WebSocketService';
import { syncService } from '@/services/CollectionSyncService';
import { dbService } from '@/services/DatabaseService';
import { useSessionStore } from '@/store/useSessionStore';
import { Release } from '@/types';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockResolvedValue([]),
        withTransactionAsync: jest.fn(async (cb) => await cb()),
    }),
}));

jest.mock('@/services/WebSocketService');
jest.mock('@/services/CollectionSyncService');
jest.mock('@/services/DatabaseService');

describe('Phase 2 Hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useSessionStore.setState({
            username: 'test-user',
            connectionState: 'disconnected',
            sessionId: null,
            nowPlaying: null,
            syncStatus: 'idle',
            syncProgress: null,
            lastSyncTime: null,
            syncError: null,
            error: null
        });
    });

    describe('useWebSocket', () => {
        it('should track connection state and session info', () => {
            let callback: any;
            (wsService.setCallbacks as jest.Mock).mockImplementation((cb) => {
                callback = cb;
            });

            const { result } = renderHook(() => useWebSocket());

            expect(result.current.connectionState).toBe('disconnected');

            act(() => {
                callback.onConnectionStateChange('connected');
                callback.onMessage({ type: 'session-joined', payload: { sessionId: 'sess-123' } });
            });

            expect(result.current.connectionState).toBe('connected');
            expect(result.current.isConnected).toBe(true);
            expect(result.current.sessionId).toBe('sess-123');
        });

        it('should handle now-playing updates', () => {
            let callback: any;
            (wsService.setCallbacks as jest.Mock).mockImplementation((cb) => {
                callback = cb;
            });

            const { result } = renderHook(() => useWebSocket());

            const nowPlaying = { track: 'Help!', artist: 'The Beatles', album: 'Help!' };
            act(() => {
                callback.onMessage({ type: 'now-playing', payload: nowPlaying });
            });

            expect(result.current.nowPlaying).toEqual(nowPlaying);
        });

        it('should provide connection actions', () => {
            const { result } = renderHook(() => useWebSocket());

            act(() => {
                result.current.connect();
            });
            expect(wsService.connect).toHaveBeenCalled();

            act(() => {
                result.current.disconnect();
            });
            expect(wsService.disconnect).toHaveBeenCalled();
        });

        it('should clean up callbacks on unmount', () => {
            const { unmount } = renderHook(() => useWebSocket());
            unmount();
            expect(wsService.clearCallbacks).toHaveBeenCalled();
        });
    });

    describe('useSyncCollection', () => {
        it('should trigger sync with userId and update store', async () => {
            const syncMock = jest.spyOn(syncService, 'syncCollection');
            syncMock.mockResolvedValue({
                success: true,
                data: { itemCount: 10, syncTime: 12345 }
            });

            const { result } = renderHook(() => useSyncCollection());

            await act(async () => {
                await result.current.sync('custom-user');
            });

            expect(syncMock).toHaveBeenCalledWith('custom-user', expect.any(Object));
            expect(useSessionStore.getState().lastSyncTime).toBe(12345);
        });

        it('should handle sync errors', async () => {
            jest.spyOn(syncService, 'syncCollection').mockResolvedValue({
                success: false,
                error: new Error('Sync Failed')
            });

            const { result } = renderHook(() => useSyncCollection());

            await act(async () => {
                await result.current.sync('test-user');
            });

            expect(result.current.syncError).toBe('Sync Failed');

            act(() => {
                result.current.resetError();
            });
            expect(result.current.syncError).toBeNull();
        });
    });

    describe('useCollectionData', () => {
        it('should load initial data into releases property', async () => {
            const getReleasesMock = (dbService.getReleases as jest.Mock).mockResolvedValue([
                { id: 1, instanceId: 101, title: 'Album 1', artist: 'Artist 1' }
            ]);

            const { result } = renderHook(() => useCollectionData());

            await act(async () => { }); // Wait for useEffect

            expect(getReleasesMock).toHaveBeenCalledWith('test-user', undefined, undefined, '');
            expect(result.current.releases).toHaveLength(1);
        });
    });

    describe('useGroupedReleases', () => {
        const releases: Release[] = [
            { id: 1, instanceId: 101, artist: 'The Beatles', title: 'Help!', added_at: 100, year: '1965', genres: 'Rock' } as Release,
            { id: 2, instanceId: 102, artist: 'Abba', title: 'Arrival', added_at: 200, year: '1976', genres: 'Pop' } as Release,
            { id: 3, instanceId: 103, artist: 'Sigur Rós', title: 'Takk', added_at: 300, year: '2005', genres: 'Post-Rock' } as Release,
            { id: 4, instanceId: 104, artist: '123', title: 'Numbers', added_at: 50, year: undefined, genres: undefined } as Release
        ];

        it('should group by artist and strip "The "', () => {
            const { result } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'artist',
                sortBy: 'artist',
                searchQuery: ''
            }));

            // Abba (A), Beatles (B - stripped "The "), Sigur Rós (S), 123 (#)
            expect(result.current.groupedReleases).toHaveLength(4);
            expect(result.current.groupedReleases[0].title).toBe('A');
            expect(result.current.groupedReleases[1].title).toBe('B');
            expect(result.current.groupedReleases[1].data[0].artist).toBe('The Beatles');
        });

        it('should group by decade and handle missing years', () => {
            const { result } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'decade',
                sortBy: 'year',
                searchQuery: ''
            }));

            // 2000s, 1970s, 1960s, Unknown
            expect(result.current.groupedReleases).toHaveLength(4);
            expect(result.current.groupedReleases[0].title).toBe('2000s');
            expect(result.current.groupedReleases[3].title).toBe('Unknown');
        });

        it('should handle diacritic-insensitive search', () => {
            const { result: res1 } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'none',
                sortBy: 'artist',
                searchQuery: 'sigur ros' // No accent
            }));
            expect(res1.current.filteredReleases).toHaveLength(1);
            expect(res1.current.filteredReleases[0].artist).toBe('Sigur Rós');

            const { result: res2 } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'none',
                sortBy: 'artist',
                searchQuery: 'rós' // With accent
            }));
            expect(res2.current.filteredReleases).toHaveLength(1);
        });

        it('should sort by various criteria', () => {
            // Test Year Sort (Latest first)
            const { result: resYear } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'none',
                sortBy: 'year',
                searchQuery: ''
            }));
            expect(resYear.current.filteredReleases[0].year).toBe('2005');

            // Test Date Added Sort (Newest first)
            const { result: resDate } = renderHook(() => useGroupedReleases({
                releases,
                groupBy: 'none',
                sortBy: 'dateAdded',
                searchQuery: ''
            }));
            expect(resDate.current.filteredReleases[0].added_at).toBe(300);
        });
    });
});
