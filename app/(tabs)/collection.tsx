import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
    SectionList,
    TouchableOpacity,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { useSessionStore } from '@/store/useSessionStore';
import { ReleaseCard } from '@/components/ReleaseCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BrowseSection } from '@/components/BrowseSection';
import { useRouter } from 'expo-router';
import { ReleaseDetailsModal } from '@/components/ReleaseDetailsModal';
import { Ionicons } from '@expo/vector-icons';
import { SessionDrawer } from '@/components/SessionDrawer';
import { useCollectionData, useGroupedReleases, useSyncCollection } from '@/hooks';
// Removed incorrect TextInput import from react-native-gesture-handler

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
    const { releases, loading, hasMore, loadMore, refresh } = useCollectionData(searchQuery);
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

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                            setLastMode(null);
                            setAuthToken(null);
                            router.replace('/');
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>
                            {username ? `${username}'s Crate` : 'The Crate'}
                        </Text>
                        {syncStatus === 'syncing' ? (
                            <View style={styles.syncStatus}>
                                <ActivityIndicator size="small" color={THEME.colors.primary} />
                                <Text style={styles.syncText}>{syncProgress}%</Text>
                            </View>
                        ) : (
                            <Text style={styles.countText}>{releases.length} Items</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.iconBtnGlass}
                    onPress={() => setIsMenuVisible(true)}
                >
                    <Ionicons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.segmentedControlContainer}>
                <SegmentedControl
                    options={['Genre', 'A-Z', 'Decade']}
                    selected={viewMode === 'artist' ? 'A-Z' : viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                    onChange={(val) => {
                        if (val === 'A-Z') setViewMode('artist');
                        else setViewMode(val.toLowerCase() as any);
                    }}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.background} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {renderHeader()}

                <View style={styles.searchContainer}>
                    <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Artists or Albums..."
                            placeholderTextColor={THEME.colors.textDim}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </BlurView>
                </View>

                <SectionList
                    sections={groupedReleases.map(g => ({ ...g, data: [g.data] }))}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, section }) => (
                        <BrowseSection
                            title={section.title}
                            releases={item}
                            onPressRelease={setSelectedRelease}
                        />
                    )}
                    renderSectionHeader={() => null}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={syncStatus === 'syncing'}
                            onRefresh={handleSync}
                            tintColor={THEME.colors.primary}
                        />
                    }
                    ListFooterComponent={loading && !isEmpty ? <ActivityIndicator color={THEME.colors.primary} /> : null}
                    ListEmptyComponent={isEmpty && !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
                            <Text style={styles.emptyText}>
                                {!username || username === 'solo_user' ? 'No collection synced' : 'Your collection is empty'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {!username || username === 'solo_user'
                                    ? 'Sync your Discogs collection in Solo Mode to start browsing.'
                                    : 'Try syncing your collection or adjusting your search.'}
                            </Text>
                        </View>
                    ) : null}
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
    searchContainer: {
        paddingHorizontal: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
    },
    searchBlur: {
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
    },
    searchInput: {
        padding: THEME.spacing.md,
        color: THEME.colors.white,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: THEME.spacing.xs,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    emptyText: {
        color: THEME.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: THEME.spacing.md,
    },
    emptySubtext: {
        color: THEME.colors.textDim,
        fontSize: 14,
        textAlign: 'center',
        marginTop: THEME.spacing.xs,
        lineHeight: 20,
    },
});
