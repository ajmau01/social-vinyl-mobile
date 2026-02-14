import React, { useState, useCallback } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform } from 'react-native';
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
    const { releases, loading, refresh } = useCollectionData(searchQuery);
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
        // TODO: Phase 9 logic
        logger.info('[CollectionScreen] Random album requested');
    }, []);

    const handleSearchToggle = useCallback(() => {
        // Prepare layout animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const nextVisible = !isSearchVisible;
        setIsSearchVisible(nextVisible);

        // Clear query if closing
        if (!nextVisible) {
            setSearchQuery('');
        }
    }, [isSearchVisible]);

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
                    onSearchPress={handleSearchToggle}
                    onRandomPress={handleRandomPress}
                    onMenuPress={() => setIsMenuVisible(true)}
                    onViewModeChange={setViewMode}
                />

                {isSearchVisible && (
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search LPs..."
                    />
                )}

                <CollectionSectionView
                    sections={groupedReleases}
                    onReleasePress={setSelectedRelease}
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
