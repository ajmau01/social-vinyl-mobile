import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from 'react-native';
import { useShallow } from 'zustand/shallow';
import { THEME } from '@/constants/theme';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { BinItem as BinItemType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BinList } from '@/components/BinList';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
import { SessionInfoModal } from '@/components/session/SessionInfoModal';

export default function BinScreen() {
    const {
        username,
        hostUsername,
        sessionId,
        sessionName,
        joinCode,
        sessionRole,
        isBroadcast,
        isPermanent
    } = useSessionStore(useShallow(state => ({
        username: state.username,
        hostUsername: state.hostUsername,
        sessionId: state.sessionId,
        sessionName: state.sessionName,
        joinCode: state.joinCode,
        sessionRole: state.sessionRole,
        isBroadcast: state.isBroadcast,
        isPermanent: state.isPermanent
    })));
    const { items, setBin } = useListeningBinStore();
    const [infoVisible, setInfoVisible] = React.useState(false);

    const userItems = items;

    const handleRemove = (item: BinItemType) => {
        if (!username) return;
        Alert.alert(
            'Remove Album',
            `Are you sure you want to remove "${item.title}" from your Listening Bin?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => listeningBinSyncService.removeAlbum(item.id)
                },
            ]
        );
    };

    const handleClear = () => {
        if (!username) return;
        Alert.alert(
            'Clear Bin',
            'Are you sure you want to clear all albums from your Listening Bin?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => listeningBinSyncService.clearBin()
                },
            ]
        );
    };

    const onDragEnd = async (data: BinItemType[]) => {
        const otherItems = items.filter(item => item.userId !== username);
        setBin([...otherItems, ...data]);

        const ids = data.map(item => item.id);
        await listeningBinSyncService.reorderAlbums(ids);
    };

    const emptyComponent = (
        <View testID="bin-empty-state" style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
            <Text style={styles.emptyText}>Your bin is empty</Text>
            <Text style={styles.emptySubtext}>Add albums from your collection to start listening.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Listening Bin</Text>
                    <View style={styles.headerActions}>
                        {sessionId && sessionRole !== 'voyeur' && (
                            <Pressable
                                testID="session-info-button"
                                onPress={() => setInfoVisible(true)}
                                style={styles.headerButton}
                            >
                                <Ionicons name="information-circle-outline" size={24} color={THEME.colors.primary} />
                            </Pressable>
                        )}
                        {userItems.length > 0 && (
                            <Pressable testID="bin-clear-button" onPress={handleClear} style={styles.headerButton}>
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <BinList
                    items={userItems}
                    username={username}
                    hostUsername={hostUsername}
                    onRemove={handleRemove}
                    onDragEnd={onDragEnd}
                    contentContainerStyle={styles.listContent}
                    emptyComponent={emptyComponent}
                />
            </SafeAreaView>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.lg,
        paddingTop: THEME.spacing.xl,
        paddingBottom: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.white,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.sm,
    },
    headerButton: {
        padding: THEME.spacing.xs,
    },
    clearButtonText: {
        color: THEME.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: THEME.spacing.md,
        paddingBottom: THEME.layout.tabBarHeight + 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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
    },
});
