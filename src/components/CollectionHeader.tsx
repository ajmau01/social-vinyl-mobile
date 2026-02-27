// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SyncStatus } from '@/types';
import { logger } from '@/utils/logger';
import { ViewMode } from '@/hooks/useGroupedReleases';

export interface CollectionHeaderProps {
    title: string;
    syncStatus: SyncStatus;
    syncProgress: number | null;
    viewMode: ViewMode;
    lastSyncTime: number | null;
    isSearchVisible: boolean;
    isRandomDisabled?: boolean;
    onSearchPress: () => void;
    onRandomPress: () => void;
    onMenuPress: () => void;
    onInfoPress?: () => void;
    onViewModeChange: (mode: ViewMode) => void;
    hideViewModes?: ViewMode[];
    onWantListPress?: () => void;
}

const VIEW_MODE_MAP: Record<string, ViewMode> = {
    'Genre': 'genre',
    'A-Z': 'artist',
    'Decade': 'decade',
    'N&N': 'new',
    'Spin': 'spin',
    'Saved': 'saved',
};

const REVERSE_VIEW_MODE_MAP: Record<string, string> = {
    'genre': 'Genre',
    'artist': 'A-Z',
    'decade': 'Decade',
    'new': 'N&N',
    'spin': 'Spin',
    'saved': 'Saved',
};

function getCacheStatusText(lastSyncTime: number | null): string {
    if (!lastSyncTime) return 'Not synced';
    const diffMs = Date.now() - lastSyncTime;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Updated just now';
    if (diffMin < 60) return `Updated ${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays}d ago`;
}

function isCacheStale(lastSyncTime: number | null): boolean {
    if (!lastSyncTime) return true;
    return Date.now() - lastSyncTime > 6 * 60 * 60 * 1000; // 6 hours
}

const ALL_VIEW_OPTIONS = ['Genre', 'A-Z', 'Decade', 'N&N', 'Spin', 'Saved'];

export const CollectionHeader: React.FC<CollectionHeaderProps> = React.memo(({
    title,
    syncStatus,
    syncProgress,
    viewMode,
    lastSyncTime,
    isSearchVisible,
    isRandomDisabled = false,
    onSearchPress,
    onRandomPress,
    onMenuPress,
    onInfoPress,
    onViewModeChange,
    hideViewModes,
    onWantListPress,
}) => {
    const getSegmentedValue = useCallback(() => {
        return REVERSE_VIEW_MODE_MAP[viewMode] || 'Genre';
    }, [viewMode]);

    const handleSegmentedChange = useCallback((val: string) => {
        const mode = VIEW_MODE_MAP[val];
        if (mode) {
            onViewModeChange(mode);
        } else {
            logger.error(`[CollectionHeader] Unknown view mode: ${val}`);
        }
    }, [onViewModeChange]);

    const filteredOptions = useMemo(() => {
        if (!hideViewModes || hideViewModes.length === 0) return ALL_VIEW_OPTIONS;
        const hiddenLabels = new Set(hideViewModes.map(m => REVERSE_VIEW_MODE_MAP[m]).filter(Boolean));
        return ALL_VIEW_OPTIONS.filter(o => !hiddenLabels.has(o));
    }, [hideViewModes]);

    const isSyncing = syncStatus === 'syncing';
    const stale = isCacheStale(lastSyncTime);

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View>
                        <Text testID="collection-header-title" style={styles.title}>{title}</Text>
                        <Text
                            testID="collection-header-cache-status"
                            style={[styles.cacheText, stale && !isSyncing && styles.cacheTextStale]}
                        >
                            {isSyncing ? `Syncing... ${syncProgress ?? 0}%` : getCacheStatusText(lastSyncTime)}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {onInfoPress && (
                        <TouchableOpacity
                            testID="collection-header-info-button"
                            style={styles.iconBtn}
                            onPress={onInfoPress}
                        >
                            <Ionicons name="information-circle-outline" size={24} color={THEME.colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        testID="collection-header-search-button"
                        style={styles.iconBtn}
                        onPress={onSearchPress}
                        accessibilityRole="button"
                        accessibilityLabel={isSearchVisible ? 'Close search' : 'Open search'}
                    >
                        <Ionicons
                            name={isSearchVisible ? 'close' : 'search'}
                            size={22}
                            color={THEME.colors.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="collection-header-dice-button"
                        style={[styles.iconBtn, isRandomDisabled && { opacity: 0.5 }]}
                        onPress={onRandomPress}
                        disabled={isRandomDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Random album"
                        accessibilityState={{ disabled: isRandomDisabled }}
                    >
                        <Ionicons name="dice-outline" size={22} color={THEME.colors.white} />
                    </TouchableOpacity>
                    {onWantListPress && (
                        <TouchableOpacity
                            testID="collection-header-wantlist-button"
                            style={styles.iconBtn}
                            onPress={onWantListPress}
                            accessibilityRole="button"
                            accessibilityLabel="Your want list"
                        >
                            <Ionicons name="pricetag-outline" size={22} color={THEME.colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        testID="collection-header-menu-button"
                        style={styles.iconBtnGlass}
                        onPress={onMenuPress}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                    >
                        <Ionicons name="menu" size={24} color={THEME.colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.segmentedControlContainer}>
                <SegmentedControl
                    options={filteredOptions}
                    selected={getSegmentedValue()}
                    onChange={handleSegmentedChange}
                />
            </View>
        </View>
    );
});

CollectionHeader.displayName = 'CollectionHeader';

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.sm,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: THEME.colors.white,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    iconBtnGlass: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cacheText: {
        color: THEME.colors.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    cacheTextStale: {
        color: '#f59e0b',
    },
    segmentedControlContainer: {
        paddingHorizontal: THEME.spacing.md,
    },
});
