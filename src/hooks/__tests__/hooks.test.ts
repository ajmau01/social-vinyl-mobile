import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '../useWebSocket';
import { useSyncCollection } from '../useSyncCollection';
import { useCollectionData } from '../useCollectionData';
import { useGroupedReleases } from '../useGroupedReleases';
import { TestWrapper } from './testUtils';
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

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('useWebSocket', () => {
        it('should track connection state and session info', () => {
            let callback: any;
            (wsService.setCallbacks as jest.Mock).mockImplementation((cb) => {
                callback = cb;
            });

            const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

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

            const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

            const nowPlaying = { track: 'Help!', artist: 'The Beatles', album: 'Help!' };
            act(() => {
                callback.onMessage({ type: 'now-playing', payload: nowPlaying });
            });

            expect(result.current.nowPlaying).toEqual(nowPlaying);
        });

        it('should provide connection actions', () => {
            const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

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
            const { unmount } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });
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

            const { result } = renderHook(() => useSyncCollection(), { wrapper: TestWrapper });

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

            const { result } = renderHook(() => useSyncCollection(), { wrapper: TestWrapper });

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

            const { result } = renderHook(() => useCollectionData(), { wrapper: TestWrapper });

            await act(async () => { }); // Wait for useEffect

            expect(getReleasesMock).toHaveBeenCalledWith('test-user');
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

        it('should group by new (time periods)', () => {
            // Mock Date.now to a fixed time: June 1, 2026 (Day 152)
            const mockNow = 1780228800000;
            jest.spyOn(Date, 'now').mockReturnValue(mockNow);

            const daySeconds = 24 * 60 * 60;
            const weekSeconds = 7 * daySeconds;
            const monthSeconds = 30 * daySeconds;

            const releasesWithDates: Release[] = [
                { id: 1, title: 'Today Album', added_at: (mockNow / 1000) - (daySeconds / 2), artist: 'A' } as Release, // Today
                { id: 2, title: 'This Week Album', added_at: (mockNow / 1000) - (3 * daySeconds), artist: 'B' } as Release, // This Week
                { id: 3, title: 'This Month Album', added_at: (mockNow / 1000) - (15 * daySeconds), artist: 'C' } as Release, // This Month
                { id: 4, title: 'Earlier This Year Album', added_at: (mockNow / 1000) - (60 * daySeconds), artist: 'D' } as Release, // Earlier This Year (Apr 2026)
                { id: 5, title: 'Old Album', added_at: (mockNow / 1000) - (400 * daySeconds), artist: 'E' } as Release // Previous Year (Apr 2025)
            ];

            const { result } = renderHook(() => useGroupedReleases({
                releases: releasesWithDates,
                groupBy: 'new',
                sortBy: 'dateAdded',
                searchQuery: ''
            }));

            const sections = result.current.groupedReleases;
            expect(sections).toHaveLength(5);
            expect(sections[0].title).toBe('Today');
            expect(sections[1].title).toBe('This Week');
            expect(sections[2].title).toBe('This Month');
            // Depending on when the mock date falls in the year vs "Earlier this year" logic
            // 2026-02-14 - 60 days is Dec 2025? No, 60 days ago is mid-Dec 2025.
            // Wait, logic check:
            // mockNow = Feb 14, 2026.
            // 60 days ago = Dec 16, 2025.
            // So that would conform to release year != current year logic if not careful.
            // 60 days ago from Feb 14 is Dec 16.
            // Let's adjust mock dates to be safer for "Earlier This Year".
            // mockNow = June 1, 2026.
            expect(sections[3].title).toBe('Earlier This Year');
            expect(sections[4].title).toBe('2025');
        });

        it('should sort new sections correctly', () => {
            // Mock Date.now to June 1, 2026
            const mockNow = 1780228800000;
            jest.spyOn(Date, 'now').mockReturnValue(mockNow);

            const daySeconds = 24 * 60 * 60;

            const releasesWithDates: Release[] = [
                { id: 1, title: 'Today', added_at: (mockNow / 1000) - 100, artist: 'A' } as Release, // Today
                { id: 2, title: 'Week', added_at: (mockNow / 1000) - (2 * daySeconds), artist: 'B' } as Release, // This Week
                { id: 3, title: 'Month', added_at: (mockNow / 1000) - (10 * daySeconds), artist: 'C' } as Release, // This Month
                { id: 4, title: 'Year', added_at: (mockNow / 1000) - (100 * daySeconds), artist: 'D' } as Release, // Feb 2026
                { id: 5, title: 'Older', added_at: (mockNow / 1000) - (500 * daySeconds), artist: 'E' } as Release // 2025
            ];

            const { result } = renderHook(() => useGroupedReleases({
                releases: releasesWithDates,
                groupBy: 'new',
                sortBy: 'dateAdded',
                searchQuery: ''
            }));

            const sections = result.current.groupedReleases;
            expect(sections.map(s => s.title)).toEqual([
                'Today',
                'This Week',
                'This Month',
                'Earlier This Year',
                '2025'
            ]);
        });

        it('should group by saved', () => {
            const releasesWithSaved: Release[] = [
                { id: 1, title: 'Saved 1', isSaved: true, artist: 'A' } as Release,
                { id: 2, title: 'Unsaved', isSaved: false, artist: 'B' } as Release,
                { id: 3, title: 'Saved 2', isSaved: true, artist: 'C' } as Release
            ];

            const { result } = renderHook(() => useGroupedReleases({
                releases: releasesWithSaved,
                groupBy: 'saved',
                sortBy: 'artist',
                searchQuery: ''
            }));

            expect(result.current.groupedReleases).toHaveLength(1);
            expect(result.current.groupedReleases[0].title).toBe('Saved Albums');
            expect(result.current.groupedReleases[0].data).toHaveLength(2);
            expect(result.current.groupedReleases[0].data.map(r => r.title)).toEqual(['Saved 1', 'Saved 2']);
        });
    });
});
