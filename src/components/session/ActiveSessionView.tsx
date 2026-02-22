import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Alert, ActionSheetIOS, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useShallow } from 'zustand/shallow';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { NowPlayingBanner } from '../NowPlayingBanner';
import { BinList } from '../BinList';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
import { BinItem } from '@/types';

export const ActiveSessionView = () => {
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
        // Placeholder for share functionality (to be implemented in #128)
        Alert.alert('Share', `Join Code: ${joinCode}`);
    };

    const showMenu = () => {
        const options = ['Session Info', 'Share Join Code', 'End Session', 'Cancel'];
        const destructiveButtonIndex = 2;
        const cancelButtonIndex = 3;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex,
                    cancelButtonIndex,
                    title: sessionName || 'Active Session',
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        // Info (modal handled elsewhere or future enhancement)
                    } else if (buttonIndex === 1) {
                        handleShare();
                    } else if (buttonIndex === 2) {
                        handleEndSession();
                    }
                }
            );
        } else {
            Alert.alert(
                sessionName || 'Active Session',
                'Choose an action',
                [
                    { text: 'Session Info', onPress: () => { } },
                    { text: 'Share Join Code', onPress: handleShare },
                    { text: 'End Session', style: 'destructive', onPress: handleEndSession },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    const onDragEnd = async (data: BinItem[]) => {
        const otherItems = binItems.filter(item => item.userId !== username);
        setBin([...otherItems, ...data]);
        const ids = data.map(item => item.id);
        await listeningBinSyncService.reorderAlbums(ids);
    };

    const handleRemove = (item: BinItem) => {
        listeningBinSyncService.removeAlbum(item.id);
    };

    const modeLabel = sessionMode?.toUpperCase() || '';
    const modeColor = sessionMode === 'party' ? '#A855F7' : (sessionMode === 'live' ? '#EF4444' : '#71717A');

    const emptyComponent = (
        <View style={styles.emptyBin}>
            <Text style={styles.emptyBinText}>
                {sessionMode === 'party'
                    ? 'Waiting for guests to pick…'
                    : 'Add records to queue from your collection'}
            </Text>
        </View>
    );

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header / Status Bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusLeft}>
                        {sessionMode && (
                            <View style={[styles.badge, { backgroundColor: modeColor }]}>
                                <Text style={styles.badgeText}>{modeLabel}</Text>
                            </View>
                        )}
                        <Text style={styles.sessionStatusText}>
                            {isBroadcast ? 'On Air' : 'Live'}
                        </Text>
                    </View>
                    <Pressable testID="session-menu-button" onPress={showMenu} style={styles.menuButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={THEME.colors.white} />
                    </Pressable>
                </View>

                {/* Now Playing Section */}
                <View style={styles.nowPlayingSection}>
                    <NowPlayingBanner variant="full" />
                </View>

                {/* Bin List Section */}
                <View style={styles.binSection}>
                    <View style={styles.binHeader}>
                        <Text testID="up-next-title" style={styles.binTitle}>Up Next ({binItems.length})</Text>
                    </View>
                    <BinList
                        items={binItems}
                        username={username}
                        hostUsername={hostUsername}
                        onRemove={handleRemove}
                        onDragEnd={onDragEnd}
                        contentContainerStyle={styles.binListContent}
                        emptyComponent={emptyComponent}
                    />
                </View>
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
    menuButton: {
        padding: THEME.spacing.xs,
    },
    nowPlayingSection: {
        flex: 1,
        justifyContent: 'center',
    },
    binSection: {
        flex: 1.2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: THEME.spacing.lg,
    },
    binHeader: {
        paddingHorizontal: THEME.spacing.xl,
        marginBottom: THEME.spacing.sm,
    },
    binTitle: {
        color: THEME.colors.textDim,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    binListContent: {
        paddingHorizontal: THEME.spacing.md,
        paddingBottom: 40,
    },
    emptyBin: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
    },
    emptyBinText: {
        color: THEME.colors.textMuted,
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
