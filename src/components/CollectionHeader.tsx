import React from 'react';
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

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
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
    const getSegmentedValue = () => {
        if (viewMode === 'artist') return 'A-Z';
        return viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
    };

    const handleSegmentedChange = (val: string) => {
        if (val === 'A-Z') {
            onViewModeChange('artist');
        } else {
            onViewModeChange(val.toLowerCase() as 'genre' | 'decade');
        }
    };

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={onBackPress}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        {syncStatus === 'syncing' ? (
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
                        style={styles.iconBtn}
                        onPress={onSyncPress}
                        disabled={syncStatus === 'syncing'}
                    >
                        <Ionicons
                            name={syncStatus === 'syncing' ? "sync" : "sync-outline"}
                            size={24}
                            color={syncStatus === 'syncing' ? THEME.colors.primary : "#fff"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtnGlass}
                        onPress={onMenuPress}
                    >
                        <Ionicons name="menu" size={24} color="#fff" />
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
};

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
        gap: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        gap: 6,
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
