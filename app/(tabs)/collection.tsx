import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Text,
    RefreshControl,
    SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';
import { dbService, Release } from '@/services/DatabaseService';
import { syncService } from '@/services/CollectionSyncService';
import { useSessionStore } from '@/store/useSessionStore';
import { ReleaseCard } from '@/components/ReleaseCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BrowseSection } from '@/components/BrowseSection';
import { ReleaseDetailsModal } from '@/components/ReleaseDetailsModal';
import { CONFIG } from '@/config';

const PAGE_SIZE = 5000; // Load all for client-side sorting. Note: Collections > 5k items may see performance degradation on low-end devices.

export default function CollectionScreen() {
    const [releases, setReleases] = useState<Release[]>([]);
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Sync State
    const syncStatus = useSessionStore(state => state.syncStatus);
    const syncProgress = useSessionStore(state => state.syncProgress);

    // Initial Load
    useEffect(() => {
        loadReleases(true).then((data) => {
            // Auto-Sync if DB is empty (First Run)
            if (data && data.length === 0) {
                console.log('[App] DB empty, triggering auto-sync...');
                handleSync();
            }
        });
    }, []);

    const loadReleases = async (reset = false) => {
        if (loading && !reset) return;

        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;

            // Limit is PAGE_SIZE (10000) so we load all
            const newReleases = await dbService.getReleases(PAGE_SIZE, currentOffset, searchQuery);

            if (reset) {
                setReleases(newReleases);
                setOffset(PAGE_SIZE);
            } else {
                setReleases(prev => [...prev, ...newReleases]);
                setOffset(prev => prev + PAGE_SIZE);
            }

            setHasMore(newReleases.length === PAGE_SIZE);
            return newReleases;
        } catch (error) {
            console.error('Failed to load releases', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Debounce/Reload when search changes
    useEffect(() => {
        const timer = setTimeout(() => {
            loadReleases(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'genre' | 'decade' | 'alpha'>('grid');

    // Grouping Helper
    const getGroupedReleases = () => {
        if (viewMode === 'grid') return []; // Flat grid for simple view

        const groups: { title: string; data: Release[] }[] = [];
        const groupMap = new Map<string, Release[]>();

        releases.forEach(release => {
            if (viewMode === 'genre') {
                // Support Multi-Genre: Iterate all genres
                if (release.genres) {
                    const genres = release.genres.split(',').map(g => g.trim()).filter(g => g.length > 0);
                    genres.forEach(genre => {
                        if (!groupMap.has(genre)) {
                            groupMap.set(genre, []);
                        }
                        groupMap.get(genre)!.push(release);
                    });
                } else {
                    const key = 'Uncategorized';
                    if (!groupMap.has(key)) groupMap.set(key, []);
                    groupMap.get(key)!.push(release);
                }
            } else if (viewMode === 'decade') {
                let key = 'Unknown Year';
                if (release.year) {
                    const year = parseInt(release.year);
                    if (!isNaN(year)) {
                        const decade = Math.floor(year / 10) * 10;
                        key = `${decade}s`;
                    }
                }

                if (!groupMap.has(key)) {
                    groupMap.set(key, []);
                }
                groupMap.get(key)!.push(release);
            } else if (viewMode === 'alpha') {
                // Group by First Letter
                let key = '#';
                if (release.title && release.title.length > 0) {
                    const firstChar = release.title.charAt(0).toUpperCase();
                    if (/[A-Z]/.test(firstChar)) {
                        key = firstChar;
                    }
                }
                if (!groupMap.has(key)) {
                    groupMap.set(key, []);
                }
                groupMap.get(key)!.push(release);
            }
        });

        // Convert Map to Array and Sort Keys
        Array.from(groupMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0])) // Alpha sort categories
            .forEach(([title, data]) => {
                groups.push({ title, data });
            });

        return groups;
    };

    const handleSync = async () => {
        // Trigger sync for default user
        // TODO: Get actual user ID from auth context later
        await syncService.syncCollection(CONFIG.DEFAULT_WATCHED_USERNAME);
        // Reload list after sync completes
        loadReleases(true);
    };

    const renderHeader = () => (
        <View>
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

            <View style={styles.segmentedControlContainer}>
                <SegmentedControl
                    options={['Genre', 'A-Z', 'Decade']}
                    selected={viewMode === 'grid' ? 'Grid' : (viewMode === 'alpha' ? 'A-Z' : viewMode.charAt(0).toUpperCase() + viewMode.slice(1))}
                    onChange={(val) => {
                        if (val === 'A-Z') setViewMode('alpha');
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

                {viewMode === 'grid' ? (
                    <FlatList
                        data={releases}
                        renderItem={({ item }) => (
                            <ReleaseCard
                                release={item}
                                onPress={() => setSelectedRelease(item)}
                            />
                        )}
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
                ) : (
                    <SectionList
                        sections={getGroupedReleases().map(g => ({ title: g.title, data: [g.data] }))} // Shaping for Horizontal list in Vertical list
                        keyExtractor={(item, index) => item[0].id.toString() + index}
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
                    />
                )}

                <ReleaseDetailsModal
                    visible={!!selectedRelease}
                    release={selectedRelease}
                    onClose={() => setSelectedRelease(null)}
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
        paddingBottom: 100, // Space for tab bar + playing banner
    },
});
