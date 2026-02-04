import { renderHook, act } from '@testing-library/react-native';
import { useWebSocketStatus } from '../useWebSocketStatus';
import { useSyncCollection } from '../useSyncCollection';
import { useCollection } from '../useCollection';
import { useGroupedCollection } from '../useGroupedCollection';
import { wsService } from '@/services/WebSocketService';
import { syncService } from '@/services/CollectionSyncService';
import { dbService } from '@/services/DatabaseService';
import { useSessionStore } from '@/store/useSessionStore';

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
            syncStatus: 'idle',
            syncProgress: null,
            lastSyncTime: null
        });
    });

    describe('useWebSocketStatus', () => {
        it('should track connection state changes', () => {
            let callback: any;
            (wsService.setCallbacks as jest.Mock).mockImplementation((cb) => {
                callback = cb;
            });

            const { result } = renderHook(() => useWebSocketStatus());

            expect(result.current.status).toBe('disconnected');

            act(() => {
                callback.onConnectionStateChange('connected');
            });

            expect(result.current.status).toBe('connected');
            expect(result.current.isConnected).toBe(true);
        });

        it('should handle errors', () => {
            let callback: any;
            (wsService.setCallbacks as jest.Mock).mockImplementation((cb) => {
                callback = cb;
            });

            const { result } = renderHook(() => useWebSocketStatus());

            const testError = new Error('Test Error');
            act(() => {
                callback.onError(testError);
            });

            expect(result.current.status).toBe('disconnected');
            expect(result.current.error).toBe(testError);
        });
    });

    describe('useSyncCollection', () => {
        it('should trigger sync and update store', async () => {
            const syncMock = jest.spyOn(syncService, 'syncCollection');
            syncMock.mockResolvedValue({
                success: true,
                data: { itemCount: 10, syncTime: 12345 }
            });

            const { result } = renderHook(() => useSyncCollection());

            await act(async () => {
                await result.current.sync();
            });

            expect(syncMock).toHaveBeenCalledWith('test-user', expect.any(Object));
            expect(useSessionStore.getState().lastSyncTime).toBe(12345);
        });
    });

    describe('useCollection', () => {
        it('should load initial data', async () => {
            const getReleasesMock = (dbService.getReleases as jest.Mock).mockResolvedValue([
                { id: 1, title: 'Album 1', artist: 'Artist 1' }
            ]);

            const { result } = renderHook(() => useCollection());

            // Wait for useEffect
            await act(async () => { });

            expect(getReleasesMock).toHaveBeenCalledWith('test-user', 50, 0, '');
            expect(result.current.items).toHaveLength(1);
        });

        it('should handle search queries', async () => {
            const getReleasesMock = (dbService.getReleases as jest.Mock).mockResolvedValue([]);

            const { rerender } = renderHook(
                ({ query }: { query: string }) => useCollection(query),
                { initialProps: { query: '' } }
            );

            await act(async () => { });
            expect(getReleasesMock).toHaveBeenCalledWith('test-user', 50, 0, '');

            rerender({ query: 'rock' });
            await act(async () => { });

            expect(getReleasesMock).toHaveBeenCalledWith('test-user', 50, 0, 'rock');
        });
    });

    describe('useGroupedCollection', () => {
        it('should group releases by artist first letter', () => {
            const releases: any = [
                { id: 1, artist: 'Abba', title: 'Arrival' },
                { id: 2, artist: 'AC/DC', title: 'TNT' },
                { id: 3, artist: 'Beatles', title: 'Help' },
                { id: 4, artist: '123', title: 'Numbers' }
            ];

            const { result } = renderHook(() => useGroupedCollection(releases));

            expect(result.current).toHaveLength(3); // A, B, #
            expect(result.current[0].title).toBe('A');
            expect(result.current[0].data).toHaveLength(2);
            expect(result.current[1].title).toBe('B');
            expect(result.current[2].title).toBe('#');
        });
    });
});
