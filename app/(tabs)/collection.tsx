import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
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
import { useCollectionData, useGroupedReleases, useSyncCollection, ViewMode, useDailySpin } from '@/hooks';
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
    const { releases, loading: loadingCollection, refresh: refreshCollection } = useCollectionData();

    // Inventory Data (Standard Views)
    const { groupedReleases, filteredReleases, isEmpty: isCollectionEmpty } = useGroupedReleases({
        releases,
        groupBy: viewMode === 'spin' ? 'none' : viewMode, // Don't group inventory if in spin mode
        sortBy: 'artist',
        searchQuery
    });

    // History Data (Daily Spin View)
    const { historySections, loading: loadingHistory, refresh: refreshHistory } = useDailySpin(username);

    // Determine which data to show
    const isSpinMode = viewMode === 'spin';
    const activeSections = isSpinMode ? historySections : groupedReleases;
    const isLoading = isSpinMode ? loadingHistory : loadingCollection;

    // For random pick, use inventory (always pick from full collection, not history)
    const randomSource = releases;

    const { sync } = useSyncCollection();

    const handleSync = useCallback(async () => {
        if (!username) return;

        if (isSpinMode) {
            // If in history view, just refresh history
            await refreshHistory();
        } else {
            // standard full sync
            await sync(username);
            refreshCollection();
        }
    }, [username, sync, refreshCollection, refreshHistory, isSpinMode]);

    const handleRandomPress = useCallback(() => {
        const source = filteredReleases.length > 0 ? filteredReleases : releases;
        if (!source || source.length === 0) return;

        const randomIndex = Math.floor(Math.random() * source.length);
        const randomRelease = source[randomIndex];

        logger.info(`[CollectionScreen] Random album selected: ${randomRelease.title} (from ${source.length} available)`);

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setSelectedRelease(randomRelease);
    }, [filteredReleases, releases]);

    const handleSearchToggle = useCallback(() => {
        const nextVisible = !isSearchVisible;
        setIsSearchVisible(nextVisible);

        // Clear query if closing
        if (!nextVisible) {
            setSearchQuery('');
        }
    }, [isSearchVisible]);

    const handleReleaseLongPress = useCallback((release: Release) => {
        Alert.alert(
            "Highlight Album",
            "Select an action for this release:",
            [
                {
                    text: release.isNotable ? "Remove from Notable" : "Mark as Notable (Host)",
                    onPress: async () => {
                        try {
                            const db = DatabaseService.getInstance();
                            const newState = await db.toggleNotable(release.instanceId);

                            if (newState) {
                                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }

                            logger.info(`[CollectionScreen] Release ${release.title} notable state toggled locally: ${newState}`);
                            refreshCollection();

                            if (username) {
                                await syncService.toggleNotable(username, release.id);
                            }
                        } catch (error) {
                            logger.error('[CollectionScreen] Failed to toggle notable state', error);
                        }
                    }
                },
                {
                    text: release.isSaved ? "Remove from Saved" : "Save for Later (Guest)",
                    onPress: async () => {
                        try {
                            const db = DatabaseService.getInstance();
                            const newState = await db.toggleSaved(release.instanceId);

                            if (newState) {
                                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }

                            logger.info(`[CollectionScreen] Release ${release.title} saved state toggled locally: ${newState}`);
                            refreshCollection();

                            if (username) {
                                await syncService.toggleSaved(username, release.id);
                            }
                        } catch (error) {
                            logger.error('[CollectionScreen] Failed to toggle saved state', error);
                        }
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    }, [refreshCollection, username]);

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
                    isRandomDisabled={loadingCollection || (searchQuery.trim().length > 0 && filteredReleases.length === 0) || releases.length === 0}
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
                    sections={activeSections}
                    onReleasePress={setSelectedRelease}
                    onReleaseLongPress={handleReleaseLongPress}
                    onRefresh={handleSync}
                    refreshing={syncStatus === 'syncing'}
                    loading={isLoading}
                    isEmpty={isSpinMode ? historySections.length === 0 : isCollectionEmpty}
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
