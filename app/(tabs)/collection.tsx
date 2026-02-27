// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useShallow } from 'zustand/shallow';
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
import { SessionInfoModal } from '@/components/session/SessionInfoModal';
import { CollectionSectionView } from '@/components/CollectionSectionView';
import { useCollectionData, useGroupedReleases, useSyncCollection, ViewMode, useDailySpin } from '@/hooks';
import { DatabaseService } from '@/services/DatabaseService';
import { syncService } from '@/services/CollectionSyncService';
import { useRouter } from 'expo-router';
import { useGuestCollectionContext } from '@/hooks/useGuestCollectionContext';
import { BinSummaryBar } from '@/components/BinSummaryBar';
import { ToastNotification } from '@/components/ToastNotification';
import { toggleWantList, getWantList } from '@/utils/wantList';

export default function CollectionScreen() {
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('genre');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);

    const {
        username,
        syncStatus,
        syncProgress,
        lastSyncTime,
        sessionId,
        sessionRole,
        sessionName,
        hostUsername,
        joinCode,
        isBroadcast,
        isPermanent
    } = useSessionStore(useShallow(state => ({
        username: state.username,
        syncStatus: state.syncStatus,
        syncProgress: state.syncProgress,
        lastSyncTime: state.lastSyncTime,
        sessionId: state.sessionId,
        sessionRole: state.sessionRole,
        sessionName: state.sessionName,
        hostUsername: state.hostUsername,
        joinCode: state.joinCode,
        isBroadcast: state.isBroadcast,
        isPermanent: state.isPermanent
    })));

    const router = useRouter();
    const guestCtx = useGuestCollectionContext();

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

    const hasSetGuestDefault = useRef(false);
    useEffect(() => {
        if (sessionRole === 'guest' && sessionId && !hasSetGuestDefault.current) {
            hasSetGuestDefault.current = true;
            setViewMode('new');
        }
    }, [sessionRole, sessionId]);

    const [wantedIds, setWantedIds] = useState<Set<number>>(new Set());
    const [wlToast, setWlToast] = useState({ message: '', visible: false });

    useEffect(() => {
        if (sessionRole === 'guest') {
            getWantList().then(list => setWantedIds(new Set(list.map(i => i.releaseId))));
        }
    }, [sessionRole]);

    const handleWantList = useCallback(async (release: Release) => {
        const added = await toggleWantList(release, {
            sessionId: guestCtx.sessionId,
            sessionName: guestCtx.sessionName,
            hostUsername: guestCtx.hostUsername,
        });
        setWantedIds(prev => {
            const next = new Set(prev);
            if (added) next.add(release.id); else next.delete(release.id);
            return next;
        });
        setWlToast({ message: added ? 'Added to your want list' : 'Removed from want list', visible: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [guestCtx]);

    const { sync } = useSyncCollection();

    // Guests see the host's collection — use hostUsername as the sync/load target
    const isGuestInSession = sessionRole === 'guest' && !!sessionId;
    const effectiveUsername = isGuestInSession && hostUsername ? hostUsername : username;

    const handleSync = useCallback(async () => {
        if (!effectiveUsername) return;

        if (isSpinMode) {
            // If in history view, just refresh history
            await refreshHistory();
        } else {
            await sync(effectiveUsername);
            refreshCollection();
        }
    }, [effectiveUsername, sync, refreshCollection, refreshHistory, isSpinMode]);

    // Auto-sync host collection on first guest visit (no local data on fresh device).
    // Track by sessionId so the sync fires again if the guest joins a different session.
    const autoSyncedSessionRef = useRef<string | number | null>(null);
    useEffect(() => {
        if (isGuestInSession && hostUsername && releases.length === 0 && !loadingCollection && autoSyncedSessionRef.current !== sessionId) {
            autoSyncedSessionRef.current = sessionId;
            sync(hostUsername).then(() => refreshCollection());
        }
    }, [isGuestInSession, sessionId, hostUsername, releases.length, loadingCollection, sync, refreshCollection]);

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
        if (sessionRole === 'guest') return;
        Alert.alert(
            "Highlight Album",
            "Select an action for this release:",
            [
                {
                    text: release.isNotable ? "Remove from Notable" : "Mark as Notable (Host)",
                    onPress: async () => {
                        try {
                            const db = DatabaseService.getInstance();
                            const newState = await db.toggleNotable(release.instanceId ?? release.id);

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
                            const newState = await db.toggleSaved(release.instanceId ?? release.id);

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
    }, [refreshCollection, username, sessionRole]);

    return (
        <View style={styles.container}>
            <View style={styles.background} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <CollectionHeader
                    title={
                        sessionRole === 'guest'
                            ? (sessionName || (hostUsername ? `${hostUsername}'s Party` : 'Party Session'))
                            : (username ? `${username}'s Crate` : 'The Crate')
                    }
                    syncStatus={syncStatus}
                    syncProgress={syncProgress}
                    viewMode={viewMode}
                    lastSyncTime={lastSyncTime}
                    isSearchVisible={isSearchVisible}
                    isRandomDisabled={loadingCollection || (searchQuery.trim().length > 0 && filteredReleases.length === 0) || releases.length === 0}
                    onSearchPress={handleSearchToggle}
                    onRandomPress={handleRandomPress}
                    onMenuPress={() => setIsMenuVisible(true)}
                    onInfoPress={sessionId && sessionRole !== 'voyeur' ? () => setInfoVisible(true) : undefined}
                    onViewModeChange={setViewMode}
                    hideViewModes={sessionRole === 'guest' ? ['spin'] : undefined}
                    onWantListPress={sessionRole === 'guest' && !!sessionId ? () => router.push('/want-list') : undefined}
                />

                {guestCtx.isGuest && guestCtx.isInSession && guestCtx.binItemCount > 0 && (
                    <BinSummaryBar
                        count={guestCtx.binItemCount}
                        onPress={() => router.replace('/(tabs)/bin')}
                    />
                )}

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
                    guestMode={sessionRole === 'guest'}
                    wantedReleaseIds={sessionRole === 'guest' ? wantedIds : undefined}
                    onWantList={sessionRole === 'guest' ? handleWantList : undefined}
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

                {sessionId && sessionRole !== 'voyeur' && (
                    <SessionInfoModal
                        visible={infoVisible}
                        sessionName={sessionName || 'Session'}
                        hostName={hostUsername || 'Unknown Host'}
                        joinCode={joinCode || '?????'}
                        isBroadcast={!!isBroadcast}
                        isPermanent={!!isPermanent}
                        onClose={() => setInfoVisible(false)}
                    />
                )}

                <ToastNotification
                    message={wlToast.message}
                    visible={wlToast.visible}
                    variant="success"
                    duration={2000}
                    onDismiss={() => setWlToast(prev => ({ ...prev, visible: false }))}
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
