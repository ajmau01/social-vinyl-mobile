import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Text,
    RefreshControl,
    SectionList,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';
import { dbService } from '@/services/DatabaseService';
import { Release } from '@/types';
import { syncService } from '@/services/CollectionSyncService';
import { useSessionStore } from '@/store/useSessionStore';
import { ReleaseCard } from '@/components/ReleaseCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BrowseSection } from '@/components/BrowseSection';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ReleaseDetailsModal } from '@/components/ReleaseDetailsModal';
import { CONFIG } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import { SessionDrawer } from '@/components/SessionDrawer';

const PAGE_SIZE = 5000; // Load all for client-side sorting. Note: Collections > 5k items may see performance degradation on low-end devices.

// Helper to remove accents/diacritics
const normalizeString = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Helper to get sortable name (ignore leading "The", normalize accents)
const getSortableName = (name: string) => {
    if (!name) return '';
    let n = normalizeString(name).toLowerCase().trim();
    if (n.startsWith('the ')) {
        return n.substring(4);
    }
    return n;
};

export default function CollectionScreen() {
    const router = useRouter();
    const { initialView } = useLocalSearchParams<{ initialView: string }>();

    const [releases, setReleases] = useState<Release[]>([]);
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    // Sync State
    const {
        username,
        syncStatus,
        syncProgress,
        setLastMode,
        setAuthToken
    } = useSessionStore();

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

    const filteredReleases = useMemo(() => {
        if (!searchQuery) return releases;
        const normalizedQuery = normalizeString(searchQuery.toLowerCase().trim());
        return releases.filter((release: Release) => {
            const normalizedTitle = normalizeString(release.title.toLowerCase());
            const normalizedArtist = normalizeString(release.artist.toLowerCase());
            return normalizedTitle.includes(normalizedQuery) || normalizedArtist.includes(normalizedQuery);
        });
    }, [releases, searchQuery]);

    const loadReleases = async (reset = false) => {
        if (loading && !reset) return;

        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;

            // We skip searchQuery in DB fetch because we handle it client-side for diacritic parity
            const newReleases = await dbService.getReleases(PAGE_SIZE, currentOffset, '');

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

    // Reload when sync completes (search handled client-side now)
    useEffect(() => {
        if (syncStatus === 'idle' && releases.length === 0) {
            loadReleases(true);
        }
    }, [syncStatus]);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'genre' | 'decade' | 'alpha'>('genre');

    // Handle initial view from landing page
    useEffect(() => {
        if (initialView) {
            if (initialView === 'alpha') setViewMode('alpha');
            else if (initialView === 'decade') setViewMode('decade');
            else setViewMode('genre');
        }
    }, [initialView]);

    // Grouping Helper
    const getGroupedReleases = () => {
        if (viewMode === 'grid') return []; // Flat grid for simple view

        const groups: { title: string; data: Release[] }[] = [];
        const groupMap = new Map<string, Release[]>();

        filteredReleases.forEach((release: Release) => {
            if (viewMode === 'genre') {
                // Support Multi-Genre: Iterate all genres
                if (release.genres) {
                    const genres = release.genres.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0);
                    genres.forEach((genre: string) => {
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
                // Group by First Letter of Artist (sortable)
                let key = '#';
                const sortableArtist = getSortableName(release.artist);
                if (sortableArtist.length > 0) {
                    const firstChar = sortableArtist.charAt(0).toUpperCase();
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
            .sort((a, b) => {
                if (a[0] === '#') return 1; // # at end
                if (b[0] === '#') return -1;
                return a[0].localeCompare(b[0]);
            })
            .forEach(([title, data]) => {
                // Sort albums within group: Artist -> Title -> Year
                data.sort((a, b) => {
                    const sortA = getSortableName(a.artist);
                    const sortB = getSortableName(b.artist);
                    if (sortA !== sortB) return sortA.localeCompare(sortB);

                    const titleA = normalizeString(a.title).toLowerCase();
                    const titleB = normalizeString(b.title).toLowerCase();
                    if (titleA !== titleB) return titleA.localeCompare(titleB);

                    return (parseInt(a.year || '0') - parseInt(b.year || '0'));
                });
                groups.push({ title, data });
            });

        return groups;
    };

    const handleSync = async () => {
        if (!username) return;
        await syncService.syncCollection(username);
        // Reload list after sync completes
        loadReleases(true);
    };

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
                        data={filteredReleases}
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
        paddingBottom: 100, // Space for tab bar + playing banner
    },
});
