// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { act, renderHook } from '@testing-library/react-native';
import { useListeningBinStore } from '../useListeningBinStore';
import { Release, BinItem } from '@/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('useListeningBinStore', () => {
    const mockRelease: Release = {
        id: 1,
        instanceId: 101,
        userId: 'user1',
        title: 'Test Album',
        artist: 'Test Artist',
        thumb_url: 'http://test.com/img.jpg',
        added_at: 1234567890,
    };

    beforeEach(() => {
        // Reset store
        const { clearBin } = useListeningBinStore.getState();
        act(() => {
            clearBin();
        });
    });

    it('should add item optimistically', () => {
        const { result } = renderHook(() => useListeningBinStore());

        act(() => {
            result.current.addAlbumOptimistic(mockRelease, 'user1', 'temp-123');
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(expect.objectContaining({
            id: 1,
            userId: 'user1',
            status: 'pending',
            tempId: 'temp-123'
        }));
    });

    it('should confirm optimistic add', () => {
        const { result } = renderHook(() => useListeningBinStore());

        act(() => {
            result.current.addAlbumOptimistic(mockRelease, 'user1', 'temp-123');
        });

        const realTimestamp = Date.now();
        act(() => {
            result.current.confirmAdd('temp-123', 1, realTimestamp);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(expect.objectContaining({
            id: 1,
            status: 'synced',
            addedTimestamp: realTimestamp,
            tempId: undefined
        }));
    });

    // ────────────────────────────────────────────────────────────
    // Test 2: confirmAdd preserves clientUUID (= tempId sent to backend)
    // Regression: clientUUID was cleared during confirmAdd, breaking remove ownership
    // ────────────────────────────────────────────────────────────
    it('confirmAdd sets clientUUID equal to tempId and clears tempId', () => {
        const { result } = renderHook(() => useListeningBinStore());

        act(() => {
            result.current.addAlbumOptimistic(mockRelease, 'user1', 'test-uuid-123');
        });

        act(() => {
            result.current.confirmAdd('test-uuid-123', 9999, Date.now(), 1601);
        });

        const item = result.current.items[0];
        expect(item.clientUUID).toBe('test-uuid-123');  // preserved
        expect(item.tempId).toBeUndefined();             // cleared
        expect(item.id).toBe(1601);                      // instanceId after confirm
    });

    it('should revert optimistic add', () => {
        const { result } = renderHook(() => useListeningBinStore());

        act(() => {
            result.current.addAlbumOptimistic(mockRelease, 'user1', 'temp-123');
            result.current.revertAdd('temp-123');
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('should ignore duplicate optimistic add', () => {
        const { result } = renderHook(() => useListeningBinStore());

        // Add real item first
        act(() => {
            result.current.addItem(mockRelease, 'user1');
        });

        // Try to add same item optimistically
        act(() => {
            result.current.addAlbumOptimistic(mockRelease, 'user1', 'temp-456');
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].status).toBe('synced');
    });

    it('should remove item optimistically', () => {
        const { result } = renderHook(() => useListeningBinStore());

        // Setup: Add real item
        act(() => {
            result.current.addItem(mockRelease, 'user1');
        });
        expect(result.current.items).toHaveLength(1);

        // Remove optimistically
        act(() => {
            result.current.removeAlbumOptimistic(1, 'user1');
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('should revert optimistic remove', () => {
        const { result } = renderHook(() => useListeningBinStore());

        const timestamp = Date.now();
        // Setup via direct store manipulation or addItem custom logic
        // But since revertRemove recreates the item, we test that flow

        act(() => {
            result.current.revertRemove(mockRelease, 'user1', timestamp);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(expect.objectContaining({
            id: 1,
            userId: 'user1',
            status: 'synced',
            addedTimestamp: timestamp
        }));
    });
});
