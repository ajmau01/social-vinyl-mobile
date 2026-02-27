// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { useCallback } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { SyncStatus, SyncResult, Result } from '@/types';

export interface UseSyncCollectionResult {
    sync: (userId: string) => Promise<Result<SyncResult>>;
    syncStatus: SyncStatus;
    syncProgress: number | null;
    lastSyncTime: number | null;
    isSyncing: boolean;
    syncError: string | null;
    resetError: () => void;
}

/**
 * useSyncCollection Hook
 * 
 * Manages the background synchronization of the collection.
 * Integrates with useSessionStore for global state persistence.
 */
export const useSyncCollection = (): UseSyncCollectionResult => {
    const { syncService } = useServices();
    const {
        syncStatus,
        syncProgress,
        lastSyncTime,
        syncError,
        setSyncStatus,
        setSyncProgress,
        setLastSyncTime,
        setSyncError
    } = useSessionStore();

    const sync = useCallback(async (userId: string) => {
        setSyncError(null);
        setSyncStatus('syncing');
        setSyncProgress(0);

        const result = await syncService.syncCollection(userId, {
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
        } else {
            setSyncError(result.error.message);
        }

        return result;
    }, [syncService, setSyncProgress, setSyncStatus, setLastSyncTime, setSyncError]);

    const resetError = useCallback(() => {
        setSyncError(null);
        if (syncStatus === 'error') {
            setSyncStatus('idle');
        }
    }, [setSyncError, syncStatus, setSyncStatus]);

    return {
        sync,
        syncStatus,
        syncProgress,
        lastSyncTime,
        isSyncing: syncStatus === 'syncing',
        syncError,
        resetError
    };
};
