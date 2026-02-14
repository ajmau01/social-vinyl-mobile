import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { logger } from '@/utils/logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { useSessionStore } from '@/store/useSessionStore';
import { ReleaseDetailsModal } from '@/components/ReleaseDetailsModal';
import { SessionDrawer } from '@/components/SessionDrawer';
import { CollectionHeader } from '@/components/CollectionHeader';
import { SearchBar } from '@/components/SearchBar';
import { CollectionSectionView } from '@/components/CollectionSectionView';
import { useCollectionData, useGroupedReleases, useSyncCollection, ViewMode } from '@/hooks';
import { DatabaseService } from '@/services/DatabaseService';
import { syncService } from '@/services/CollectionSyncService';

export default function CollectionScreen() {
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('genre');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const {
        username,
        syncStatus,
        syncProgress,
        lastSyncTime
    } = useSessionStore();

    // Hooks for data and sync
    const { releases, loading, refresh } = useCollectionData();
    const { groupedReleases, isEmpty } = useGroupedReleases({
        releases,
        groupBy: viewMode,
        sortBy: 'artist',
        searchQuery
    });
    const { sync } = useSyncCollection();

    const handleSync = useCallback(async () => {
        if (!username) return;
        await sync(username);
        refresh();
    }, [username, sync, refresh]);

    const handleRandomPress = useCallback(() => {
        if (!releases || releases.length === 0) return;

        const randomIndex = Math.floor(Math.random() * releases.length);
        const randomRelease = releases[randomIndex];

        logger.info(`[CollectionScreen] Random album selected: ${randomRelease.title}`);

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setSelectedRelease(randomRelease);
    }, [releases]);

    const handleSearchToggle = useCallback(() => {
        const nextVisible = !isSearchVisible;
        setIsSearchVisible(nextVisible);

        // Clear query if closing
        if (!nextVisible) {
            setSearchQuery('');
        }
    }, [isSearchVisible]);

    const handleReleaseLongPress = useCallback(async (release: Release) => {
        try {
            const db = DatabaseService.getInstance();
            const isSaved = await db.toggleSaved(release.instanceId);

            // Visual/Tactile Feedback
            if (isSaved) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            logger.info(`[CollectionScreen] Release ${release.title} saved locally: ${isSaved}`);
            refresh(); // Trigger data refresh to show the indicator

            // Phase 9: Persist to Backend (Fire and Forget)
            if (username) {
                syncService.toggleNotable(username, release.id).then(success => {
                    if (success) {
                        logger.info(`[CollectionScreen] Release ${release.id} notable status synced to backend`);
                    } else {
                        logger.warn(`[CollectionScreen] Failed to sync notable status for release ${release.id}`);
                        // Optional: Revert local state or show toast? 
                        // For now, we trust the optimistic update and let next sync fix any drift.
                    }
                });
            }
        } catch (error) {
            logger.error('[CollectionScreen] Failed to toggle saved state', error);
        }
    }, [refresh, username]);

    return (
        <View style={styles.container}>
            <View style={styles.background} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <CollectionHeader
                    title={username ? `${username}'s Crate` : 'The Crate'}
                    syncStatus={syncStatus}
                    syncProgress={syncProgress}
                    viewMode={viewMode}
                    lastSyncTime={lastSyncTime}
                    isSearchVisible={isSearchVisible}
                    isRandomDisabled={loading || !releases || releases.length === 0}
                    onSearchPress={handleSearchToggle}
                    onRandomPress={handleRandomPress}
                    onMenuPress={() => setIsMenuVisible(true)}
                    onViewModeChange={setViewMode}
                />

                {isSearchVisible && (
                    <Animated.View
                        entering={FadeInUp.duration(250)}
                        exiting={FadeOutUp.duration(200)}
                        layout={LinearTransition}
                    >
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search LPs..."
                        />
                    </Animated.View>
                )}

                <CollectionSectionView
                    sections={groupedReleases}
                    onReleasePress={setSelectedRelease}
                    onReleaseLongPress={handleReleaseLongPress}
                    onRefresh={handleSync}
                    refreshing={syncStatus === 'syncing'}
                    loading={loading}
                    isEmpty={isEmpty}
                    username={username}
                />

                <ReleaseDetailsModal
                    visible={!!selectedRelease}
                    release={selectedRelease}
                    onClose={() => setSelectedRelease(null)}
                    onRandomNext={handleRandomPress}
                />

                <SessionDrawer
                    isVisible={isMenuVisible}
                    onClose={() => setIsMenuVisible(false)}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.colors.background,
    },
    safeArea: {
        flex: 1,
    },
});
