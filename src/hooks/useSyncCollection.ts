import { useCallback } from 'react';
import { syncService } from '@/services/CollectionSyncService';
import { useSessionStore } from '@/store/useSessionStore';
import { SyncStatus } from '@/types';

/**
 * useSyncCollection Hook
 * 
 * Manages the background synchronization of the collection.
 * Integrates with useSessionStore for global state persistence.
 */
export const useSyncCollection = () => {
    const {
        syncStatus,
        syncProgress,
        lastSyncTime,
        setSyncStatus,
        setSyncProgress,
        setLastSyncTime,
        username
    } = useSessionStore();

    const sync = useCallback(async () => {
        if (!username) return;

        const result = await syncService.syncCollection(username, {
            onProgress: (progress: number) => {
                setSyncProgress(progress);
            },
            onStatusChange: (status: SyncStatus) => {
                setSyncStatus(status);
            }
        });

        if (result.success) {
            setLastSyncTime(result.data.syncTime);
            setSyncProgress(null);
        }

        return result;
    }, [username, setSyncProgress, setSyncStatus, setLastSyncTime]);

    return {
        sync,
        status: syncStatus,
        progress: syncProgress,
        lastSyncTime,
        isSyncing: syncStatus === 'syncing',
        error: syncStatus === 'error'
    };
};
