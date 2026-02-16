import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '@/services/DatabaseService';
import { useSessionStore } from '@/store/useSessionStore';
import { Release } from '@/types';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config';

/**
 * useCollectionData Hook
 * 
 * Fetches entire collection from local SQLite database.
 * Supports search and auto-refresh on sync completion.
 */
export const useCollectionData = () => {
    const { username } = useSessionStore();
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const loadingRef = useRef(false);

    const loadData = useCallback(async (isRefresh: boolean = false) => {
        // GUARD: Don't load while syncing to avoid database inconsistency
        const isSyncing = useSessionStore.getState().syncStatus === 'syncing';
        logger.log(`[useCollectionData] loadData called. username: ${username}, loadingRef.current: ${loadingRef.current}, isRefresh: ${isRefresh}, isSyncing: ${isSyncing}`);

        // Use ref for guard to avoid dependency loop
        if (!username || loadingRef.current || (!isRefresh && isSyncing)) {
            logger.log(`[useCollectionData] loadData guarded. username: ${username}, loadingRef.current: ${loadingRef.current}, isRefresh: ${isRefresh}, isSyncing: ${isSyncing}`);
            return;
        }

        setLoading(true);
        loadingRef.current = true;
        logger.log(`[useCollectionData] Starting data load. isRefresh: ${isRefresh}`);

        if (isRefresh) {
            setRefreshing(true);
        }

        try {
            // Fetch all releases at once (no pagination)
            // Search filtering is done client-side by useGroupedReleases hook
            const items = await dbService.getReleases(username);
            setReleases(items);

            logger.log(`[useCollectionData] Successfully loaded ${items.length} items for user: ${username}`);
        } catch (error) {
            logger.error('[useCollectionData] Load failed', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            loadingRef.current = false;
        }
    }, [username]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // AUTO-REFRESH: Reload when sync completes (with small delay for DB writes)
    const syncStatus = useSessionStore((s) => s.syncStatus);
    useEffect(() => {
        if (syncStatus === 'complete') {
            if (CONFIG.DEBUG_WS) {
                logger.log('[useCollectionData] Sync complete, reloading...');
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
