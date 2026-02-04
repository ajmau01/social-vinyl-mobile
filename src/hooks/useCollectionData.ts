import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '@/services/DatabaseService';
import { useSessionStore } from '@/store/useSessionStore';
import { Release } from '@/types';

// No pagination - load everything
const PAGE_SIZE = Number.MAX_SAFE_INTEGER;

/**
 * useCollectionData Hook
 * 
 * High-performance hook for querying the local SQLite database.
 * Supports infinite scroll, search, and pull-to-refresh.
 */
export const useCollectionData = (searchQuery: string = '') => {
    const { username } = useSessionStore();
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);

    const loadData = useCallback(async (isRefresh: boolean = false) => {
        // GUARD: Don't load more while syncing to avoid database inconsistency (clearing)
        const isSyncing = useSessionStore.getState().syncStatus === 'syncing';
        if (!username || loading || (!isRefresh && isSyncing)) return;

        setLoading(true);
        if (isRefresh) {
            setRefreshing(true);
            offsetRef.current = 0;
        }

        try {
            const newItems = await dbService.getReleases(
                username,
                PAGE_SIZE,
                offsetRef.current,
                searchQuery
            );

            setReleases(prev => {
                const combined = isRefresh ? newItems : [...prev, ...newItems];
                const seen = new Set<number>();
                return combined.filter(item => {
                    const key = Number(item.instanceId);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            });

            setHasMore(newItems.length === PAGE_SIZE);
            offsetRef.current = isRefresh ? newItems.length : offsetRef.current + newItems.length;
            console.log(`[useCollectionData] Loaded ${newItems.length} items. Offset: ${offsetRef.current}, hasMore: ${newItems.length === PAGE_SIZE}`);
        } catch (error) {
            console.error('[useCollectionData] Load failed', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [username, searchQuery, loading]);

    // Initial load and search trigger
    useEffect(() => {
        loadData(true);
    }, [searchQuery]);

    // AUTO-REFRESH: Reload when sync completes
    const syncStatus = useSessionStore((s) => s.syncStatus);
    useEffect(() => {
        if (syncStatus === 'complete') {
            console.log('[useCollectionData] Sync complete, reloading...');
            loadData(true);
        }
    }, [syncStatus]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            loadData(false);
        }
    }, [hasMore, loading, loadData]);

    const refresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    return {
        releases,
        loading,
        refreshing,
        hasMore,
        loadMore,
        refresh
    };
};
