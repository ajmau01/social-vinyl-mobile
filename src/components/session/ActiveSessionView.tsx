import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Alert, ActionSheetIOS, Platform, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useShallow } from 'zustand/shallow';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { logger } from '@/utils/logger';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { BinList } from '../BinList';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
import { BinItem, Release, NowPlaying } from '@/types';
import { NowPlayingHero } from '../NowPlayingHero';

export const ActiveSessionView = () => {
    const router = useRouter();
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
        const options = ['Session Info', 'Share Join Code', 'Share QR Code', 'Stop Current', 'End Session', 'Cancel'];

        const destructiveButtonIndex = 4;
        const cancelButtonIndex = 5;

        const handleMenuPress = (buttonIndex: number) => {
            if (buttonIndex === 0) {
                Alert.alert('Session Info', `Session ID: ${sessionId}\nHost: ${hostUsername}\nMode: ${sessionMode}`);
            } else if (buttonIndex === 1) {
                handleShare();
            } else if (buttonIndex === 2) {
                handleShare();
            } else if (buttonIndex === 3) {
                handleStopPlayback();
            } else if (buttonIndex === 4) {
                handleEndSession();
            }
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex,
                    cancelButtonIndex,
                    title: sessionName || 'Active Session',
                },
                handleMenuPress
            );
        } else {
            Alert.alert(
                sessionName || 'Active Session',
                'Choose an action',
                [
                    { text: 'Session Info', onPress: () => handleMenuPress(0) },
                    { text: 'Share Join Code', onPress: () => handleMenuPress(1) },
                    { text: 'Share QR Code', onPress: () => handleMenuPress(2) },
                    { text: 'Stop Current', onPress: () => handleMenuPress(3) },
                    { text: 'End Session', style: 'destructive', onPress: () => handleMenuPress(4) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
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

