import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Text,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';
import { dbService, Release } from '@/services/DatabaseService';
import { syncService } from '@/services/CollectionSyncService';
import { useSessionStore } from '@/store/useSessionStore';
import { ReleaseCard } from '@/components/ReleaseCard';
import { CONFIG } from '@/config';

const PAGE_SIZE = 50;

export default function CollectionScreen() {
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Sync State
    const syncStatus = useSessionStore(state => state.syncStatus);
    const syncProgress = useSessionStore(state => state.syncProgress);
    const setSyncStatus = useSessionStore(state => state.setSyncStatus);

    // Initial Load
    useEffect(() => {
        loadReleases(true);
    }, []);

    const loadReleases = async (reset = false) => {
        if (loading && !reset) return;

        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;
            const newReleases = await dbService.getReleases(PAGE_SIZE, currentOffset);

            if (reset) {
                setReleases(newReleases);
                setOffset(PAGE_SIZE);
            } else {
                setReleases(prev => [...prev, ...newReleases]);
                setOffset(prev => prev + PAGE_SIZE);
            }

            setHasMore(newReleases.length === PAGE_SIZE);
        } catch (error) {
            console.error('Failed to load releases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        // Trigger sync for default user
        // TODO: Get actual user ID from auth context later
        await syncService.syncCollection(CONFIG.DEFAULT_WATCHED_USERNAME);
        // Reload list after sync completes
        loadReleases(true);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Collection</Text>
            {syncStatus === 'syncing' ? (
                <View style={styles.syncStatus}>
                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                    <Text style={styles.syncText}>{syncProgress}%</Text>
                </View>
            ) : (
                <Text style={styles.countText}>{releases.length} Items</Text>
            )}
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

                <FlatList
                    data={releases}
                    renderItem={({ item }) => <ReleaseCard release={item} />}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    onEndReached={() => loadReleases()}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={syncStatus === 'syncing'}
                            onRefresh={handleSync}
                            tintColor={THEME.colors.primary}
                        />
                    }
                    ListFooterComponent={loading ? <ActivityIndicator color={THEME.colors.primary} /> : null}
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
        backgroundColor: THEME.colors.background, // Ensure dark bg
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.colors.white,
    },
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    syncText: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    countText: {
        color: THEME.colors.textDim,
        fontSize: 14,
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
        paddingBottom: 100, // Space for tab bar + playing banner
    },
});
