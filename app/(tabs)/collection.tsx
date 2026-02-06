import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { useSessionStore } from '@/store/useSessionStore';
import { useRouter } from 'expo-router';
import { ReleaseDetailsModal } from '@/components/ReleaseDetailsModal';
import { SessionDrawer } from '@/components/SessionDrawer';
import { CollectionHeader } from '@/components/CollectionHeader';
import { SearchBar } from '@/components/SearchBar';
import { CollectionSectionView } from '@/components/CollectionSectionView';
import { useCollectionData, useGroupedReleases, useSyncCollection } from '@/hooks';

export default function CollectionScreen() {
    const router = useRouter();
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [viewMode, setViewMode] = useState<'artist' | 'genre' | 'decade'>('genre');

    const {
        username,
        syncStatus,
        syncProgress,
        setLastMode,
        setAuthToken
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

    const handleBackPress = useCallback(() => {
        setLastMode(null);
        setAuthToken(null);
        router.replace('/');
    }, [setLastMode, setAuthToken, router]);

    return (
        <View style={styles.container}>
            <View style={styles.background} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <CollectionHeader
                    title={username ? `${username}'s Crate` : 'The Crate'}
                    syncStatus={syncStatus}
                    syncProgress={syncProgress}
                    itemCount={releases.length}
                    viewMode={viewMode}
                    onBackPress={handleBackPress}
                    onSyncPress={handleSync}
                    onMenuPress={() => setIsMenuVisible(true)}
                    onViewModeChange={setViewMode}
                />

                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search Artists or Albums..."
                />

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
