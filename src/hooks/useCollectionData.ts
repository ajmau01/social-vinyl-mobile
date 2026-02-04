import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '@/services/DatabaseService';
import { useSessionStore } from '@/store/useSessionStore';
import { Release } from '@/types';

const PAGE_SIZE = 50;

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
        if (!username || loading) return;

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

            if (isRefresh) {
                setReleases(newItems);
            } else {
                setReleases(prev => [...prev, ...newItems]);
            }

            setHasMore(newItems.length === PAGE_SIZE);
            offsetRef.current += newItems.length;
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
