import { useState, useEffect, useCallback } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { Release } from '@/types';
import { CONFIG } from '@/config';

/**
 * useCollectionData Hook
 * 
 * Fetches entire collection from local SQLite database.
 * Supports search and auto-refresh on sync completion.
 */
export const useCollectionData = (searchQuery: string = '') => {
    const { databaseService } = useServices();
    const { username } = useSessionStore();
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh: boolean = false) => {
        // GUARD: Don't load while syncing to avoid database inconsistency
        const isSyncing = useSessionStore.getState().syncStatus === 'syncing';
        if (!username || loading || (!isRefresh && isSyncing)) return;

        setLoading(true);
        if (isRefresh) {
            setRefreshing(true);
        }

        try {
            // Fetch all releases at once (no pagination)
            // Search filtering is done client-side by useGroupedReleases hook with diacritic support
            const items = await databaseService.getReleases(username);
            setReleases(items);

            if (CONFIG.DEBUG_WS) {
                console.log(`[useCollectionData] Loaded ${items.length} items.`);
            }
        } catch (error) {
            console.error('[useCollectionData] Load failed', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [databaseService, username, searchQuery, loading]);

    // Initial load and search trigger
    useEffect(() => {
        loadData(true);
    }, [searchQuery]);

    // AUTO-REFRESH: Reload when sync completes (with small delay for DB writes)
    const syncStatus = useSessionStore((s) => s.syncStatus);
    useEffect(() => {
        if (syncStatus === 'complete') {
            if (CONFIG.DEBUG_WS) {
                console.log('[useCollectionData] Sync complete, reloading...');
            }
            // Small delay to ensure all DB writes are committed
            setTimeout(() => loadData(true), 100);
        }
    }, [syncStatus]);

    const refresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    return {
        releases,
        loading,
        refreshing,
        refresh
    };
};
