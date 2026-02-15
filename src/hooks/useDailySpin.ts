import { useState, useCallback, useEffect } from 'react';
import { Release } from '@/types';
import { CollectionSection } from './useGroupedReleases';
import { syncService } from '@/services/CollectionSyncService';
import { wsService } from '@/services/WebSocketService';
import { logger } from '@/utils/logger';

interface UseDailySpinResult {
    historySections: CollectionSection[];
    loading: boolean;
    refresh: () => Promise<void>;
    error: Error | null;
}

export const useDailySpin = (username?: string | null): UseDailySpinResult => {
    const [historySections, setHistorySections] = useState<CollectionSection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!username) {
            setHistorySections([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await syncService.fetchDailySpin(username);

            if (result.success && result.data) {
                const grouped = groupHistoryByDate(result.data);
                setHistorySections(grouped);
            } else {
                // If error or no data, just show empty
                if (!result.success && result.error) {
                    logger.error('[useDailySpin] Error fetching history:', result.error);
                }
                setHistorySections([]);
            }
        } catch (err) {
            logger.error('[useDailySpin] Unexpected error:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setHistorySections([]);
        } finally {
            setLoading(false);
        }
    }, [username]);

    // Initial fetch and WebSocket subscription
    useEffect(() => {
        fetchHistory();

        // Real-time update: Refresh history when a new track starts
        const unsubscribe = wsService.addCallback('onNowPlaying', (data) => {
            if (data) {
                logger.log('[useDailySpin] Now playing event received, refreshing history...');
                // Small delay to ensure backend has likely processed the history insert
                setTimeout(() => {
                    fetchHistory();
                }, 1000);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [fetchHistory]);

    return {
        historySections,
        loading,
        refresh: fetchHistory,
        error
    };
};

// Helper to group releases by date
function groupHistoryByDate(releases: Release[]): CollectionSection[] {
    const groups: { [key: string]: Release[] } = {};

    releases.forEach(release => {
        if (!release.playedAt) return; // Should not happen given service logic

        const dateKey = getDateKey(release.playedAt);

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(release);
    });

    // Sort sections: Today first, then Yesterday, then dates descending
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        // Special keys
        const specialOrder = ['Today', 'Yesterday'];
        const indexA = specialOrder.indexOf(a);
        const indexB = specialOrder.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Parse dates for others (Format: "Saturday, February 14, 2026")
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();

        return dateB - dateA; // Newest first
    });

    return sortedKeys.map(key => ({
        title: key,
        data: groups[key].sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0)) // Newest tracks first within day
    }));
}

function getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if Today
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    }

    // Check if Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    // Format: "Saturday, February 14, 2026"
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
