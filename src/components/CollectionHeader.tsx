import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SyncStatus } from '@/types';

export interface CollectionHeaderProps {
    title: string;
    syncStatus: SyncStatus;
    syncProgress: number | null;
    itemCount: number;
    viewMode: 'artist' | 'genre' | 'decade';
    onBackPress: () => void;
    onSyncPress: () => void;
    onMenuPress: () => void;
    onViewModeChange: (mode: 'artist' | 'genre' | 'decade') => void;
}

const VIEW_MODE_MAP: Record<string, 'artist' | 'genre' | 'decade'> = {
    'A-Z': 'artist',
    'Genre': 'genre',
    'Decade': 'decade'
};

const REVERSE_VIEW_MODE_MAP: Record<'artist' | 'genre' | 'decade', string> = {
    'artist': 'A-Z',
    'genre': 'Genre',
    'decade': 'Decade'
};

export const CollectionHeader: React.FC<CollectionHeaderProps> = React.memo(({
    title,
    syncStatus,
    syncProgress,
    itemCount,
    viewMode,
    onBackPress,
    onSyncPress,
    onMenuPress,
    onViewModeChange
}) => {
    const getSegmentedValue = useCallback(() => {
        return REVERSE_VIEW_MODE_MAP[viewMode];
    }, [viewMode]);

    const handleSegmentedChange = useCallback((val: string) => {
        const mode = VIEW_MODE_MAP[val];
        if (mode) {
            onViewModeChange(mode);
        } else {
            console.error(`[CollectionHeader] Unknown view mode: ${val}`);
        }
    }, [onViewModeChange]);

    const isSyncing = syncStatus === 'syncing';

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        testID="collection-header-back-button"
                        style={styles.iconBtn}
                        onPress={onBackPress}
                        accessibilityRole="button"
                        accessibilityLabel="Go back to login"
                        accessibilityHint="Returns to the login screen"
                    >
                        <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        {isSyncing ? (
                            <View style={styles.syncStatus}>
                                <ActivityIndicator size="small" color={THEME.colors.primary} />
                                <Text style={styles.syncText}>{syncProgress ?? 0}%</Text>
                            </View>
                        ) : (
                            <Text style={styles.countText}>{itemCount} Items</Text>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        testID="collection-header-sync-button"
                        style={styles.iconBtn}
                        onPress={onSyncPress}
                        disabled={isSyncing}
                        accessibilityRole="button"
                        accessibilityLabel="Sync collection"
                        accessibilityHint="Refreshes your collection from Discogs"
                        accessibilityState={{ disabled: isSyncing }}
                    >
                        <Ionicons
                            name={isSyncing ? "sync" : "sync-outline"}
                            size={24}
                            color={isSyncing ? THEME.colors.primary : THEME.colors.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="collection-header-menu-button"
                        style={styles.iconBtnGlass}
                        onPress={onMenuPress}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                        accessibilityHint="Opens the session drawer menu"
                    >
                        <Ionicons name="menu" size={24} color={THEME.colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.segmentedControlContainer}>
                <SegmentedControl
                    options={['Genre', 'A-Z', 'Decade']}
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
        gap: THEME.spacing.sm,
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
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
        marginTop: 2,
    },
    syncText: {
        color: THEME.colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    countText: {
        color: THEME.colors.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    segmentedControlContainer: {
        paddingHorizontal: THEME.spacing.md,
    },
});

