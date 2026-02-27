// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActionSheetIOS, Platform, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useShallow } from 'zustand/shallow';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { logger } from '@/utils/logger';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { BinList } from '../BinList';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
import { BinItem, Release, NowPlaying } from '@/types';
import { NowPlayingHero } from '../NowPlayingHero';

export const ActiveSessionView = () => {
    const router = useRouter();
    const { sessionService } = useServices();
    const {
        sessionId,
        sessionName,
        sessionRole,
        sessionMode,
        hostUsername,
        username,
        joinCode,
        isBroadcast
    } = useSessionStore(useShallow(state => ({
        sessionId: state.sessionId,
        sessionName: state.sessionName,
        sessionRole: state.sessionRole,
        sessionMode: state.sessionMode,
        hostUsername: state.hostUsername,
        username: state.username,
        joinCode: state.joinCode,
        isBroadcast: state.isBroadcast,
    })));

    const { nowPlaying } = useSessionStore(useShallow(state => ({
        nowPlaying: state.nowPlaying
    })));

    const { items: binItems, setBin } = useListeningBinStore();

    const handleEndSession = async () => {
        Alert.alert(
            'End Session',
            'Are you sure you want to end this listening party? Everyone will be disconnected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Session',
                    style: 'destructive',
                    onPress: async () => {
                        await listeningBinSyncService.endSession();
                    }
                }
            ]
        );
    };

    const handleLeaveSession = () => {
        Alert.alert(
            'Leave Session',
            'Leave this session? You can rejoin later with the join code.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await sessionService.leaveSession();
                        if (!result.success) {
                            Alert.alert('Error', 'Could not leave session. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = () => {
        Alert.alert('Share', `Join Code: ${joinCode}`);
    };

    const handlePlayItem = async (item: BinItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await listeningBinSyncService.playAlbum(item);
    };

    const handleStopPlayback = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await listeningBinSyncService.stopPlayback();
    };

    const isSpinning = useMemo(() => {
        if (!nowPlaying?.position || !nowPlaying?.duration) return false;
        return nowPlaying.position > 0 && nowPlaying.position < (nowPlaying.duration * 0.99);
    }, [nowPlaying?.position, nowPlaying?.duration]);

    const showMenu = () => {
        // ActiveSessionView is host-only; isPartyHost distinguishes End vs Leave behaviour
        const isPartyHost = sessionMode === 'party';

        if (Platform.OS === 'ios') {
            const options: string[] = [
                'Session Info',
                'Share Join Code',
                'Share QR Code',
                'Stop Current',
                'Leave Session',
            ];
            if (isPartyHost) options.push('End Session');
            options.push('Cancel');

            const cancelButtonIndex = options.length - 1;
            const destructiveButtonIndex = isPartyHost
                ? options.length - 2  // End Session
                : options.indexOf('Leave Session');

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex,
                    cancelButtonIndex,
                    title: sessionName || 'Active Session',
                },
                (buttonIndex) => {
                    const label = options[buttonIndex];
                    if (label === 'Session Info') {
                        Alert.alert('Session Info', `Session ID: ${sessionId}\nHost: ${hostUsername}\nMode: ${sessionMode}`);
                    } else if (label === 'Share Join Code' || label === 'Share QR Code') {
                        handleShare();
                    } else if (label === 'Stop Current') {
                        handleStopPlayback();
                    } else if (label === 'Leave Session') {
                        handleLeaveSession();
                    } else if (label === 'End Session') {
                        handleEndSession();
                    }
                }
            );
        } else {
            // Android Alert — keep to 4 buttons max (Cancel must be first)
            // Party host: Cancel | Stop Current | Leave Session | End Session
            // Solo/live:  Cancel | Stop Current | Leave Session
            const buttons: any[] = [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Stop Current', onPress: handleStopPlayback },
                { text: 'Leave Session', style: 'destructive', onPress: handleLeaveSession },
            ];
            if (isPartyHost) {
                buttons.push({ text: 'End Session', style: 'destructive', onPress: handleEndSession });
            }
            Alert.alert(sessionName || 'Active Session', 'Choose an action', buttons);
        }
    };

    const onDragEnd = async (data: BinItem[]) => {
        // As Host, we manage the entire bin order
        setBin(data);
        const ids = data.map(item => item.id);
        await listeningBinSyncService.reorderAlbums(ids);
    };

    const handleRemove = (item: BinItem) => {
        listeningBinSyncService.removeAlbum(item.id);
    };

    const modeLabel = sessionMode?.toUpperCase() || '';
    const modeColor = sessionMode === 'party' ? '#A855F7' : (sessionMode === 'live' ? '#EF4444' : '#71717A');

    const canPlayNext = binItems.length > 0 || (!!nowPlaying && !isSpinning);

    const emptyComponent = (
        <View style={styles.emptyBin}>
            <Text style={styles.emptyBinText}>
                {sessionMode === 'party'
                    ? 'Queue is empty — waiting for guests…'
                    : 'Your crate is empty. Add records to the queue.'}
            </Text>
        </View>
    );

    const listHeader = (
        <View>
            <NowPlayingHero
                nowPlaying={nowPlaying}
                onStop={handleStopPlayback}
                showStopButton={!!nowPlaying?.albumArt}
            />

            {/* Bin List Section Header */}
            <View style={styles.binHeaderContainer}>
                <View style={styles.binHeader}>
                    <Text testID="up-next-title" style={styles.binTitle}>Up Next ({binItems.length})</Text>
                    <Pressable
                        onPress={() => router.push('/(tabs)/collection')}
                        style={styles.browseLink}
                    >
                        <Ionicons name="add-circle" size={16} color={THEME.colors.primary} />
                        <Text style={styles.browseLinkText}>Browse</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header / Status Bar - Thin Strip */}
                <View style={styles.statusBar}>
                    <View style={styles.statusLeft}>
                        {sessionMode && (
                            <View style={[styles.badge, { backgroundColor: modeColor }]}>
                                <Text style={styles.badgeText}>{modeLabel}</Text>
                            </View>
                        )}
                        <Text style={styles.sessionStatusText}>
                            {isBroadcast ? 'On Air' : 'Live'} • Playing for 42m
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable testID="session-menu-button" onPress={showMenu} style={styles.menuButton}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={THEME.colors.white} />
                        </Pressable>
                    </View>
                </View>

                {/* Scrollable Content */}
                <BinList
                    items={binItems}
                    username={username}
                    hostUsername={hostUsername}
                    onRemove={handleRemove}
                    onDragEnd={onDragEnd}
                    onPlay={handlePlayItem}
                    canDisplayPlay={true}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={styles.binListContent}
                    emptyComponent={emptyComponent}
                />
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    safeArea: {
        flex: 1,
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.lg,
        paddingVertical: THEME.spacing.md,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.sm,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sessionStatusText: {
        color: THEME.colors.textDim,
        fontSize: 14,
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.md,
    },
    headerIconButton: {
        padding: THEME.spacing.xs,
    },
    menuButton: {
        padding: THEME.spacing.xs,
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: THEME.spacing.lg,
    },
    artworkWrapper: {
        width: '85%',
        aspectRatio: 1,
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
        backgroundColor: THEME.colors.surfaceLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    artworkContainer: {
        flex: 1,
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    stopButtonOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    artworkPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.surfaceLight,
    },
    metadataSection: {
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.xl,
        marginTop: THEME.spacing.sm,
        marginBottom: THEME.spacing.lg,
    },
    trackTitle: {
        color: THEME.colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    artistInfo: {
        color: THEME.colors.textDim,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    attribution: {
        color: THEME.colors.textMuted,
        fontSize: 12,
        fontStyle: 'italic',
    },
    binHeaderContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: THEME.spacing.lg,
    },
    binHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.xl,
        marginBottom: THEME.spacing.sm,
    },
    binTitle: {
        color: THEME.colors.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    browseLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    browseLinkText: {
        color: THEME.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    binListContent: {
        paddingHorizontal: THEME.spacing.md,
        paddingBottom: THEME.layout.tabBarHeight + 30, // Normal padding + TabBar height
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        flexGrow: 1,
    },
    emptyBin: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
        paddingTop: 40,
    },
    emptyBinText: {
        color: THEME.colors.textMuted,
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

