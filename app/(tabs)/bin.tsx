import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from 'react-native';
import { THEME } from '@/constants/theme';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { BinItem as BinItemType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BinItem } from '@/components/BinItem';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';

export default function BinScreen() {
    const { username, hostUsername } = useSessionStore();
    const { items, removeItem, clearBin, setBin } = useListeningBinStore();

    // Debug Play Button Logic (Removed noise)
    /*
    console.log('[BinScreen] Play Button Check:', {
        username,
        hostUsername,
        match: username === hostUsername && !!username
    });
    */

    // SCOPING: Only show items for the current user
    // FIXED: For Party Mode, we want to see ALL items in the session
    const userItems = items; // useMemo(() => items.filter(item => item.userId === username), [items, username]);

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

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<BinItemType>) => (
        <BinItem
            item={item}
            isActive={isActive}
            drag={drag}
            onRemove={handleRemove}
            canDelete={item.userId === username || username === hostUsername}
            canPlay={username === hostUsername}
            onPlay={(item) => listeningBinSyncService.playAlbum(item)}
        />
    ), [handleRemove, username, hostUsername]);

    const onDragEnd = async ({ data }: { data: BinItemType[] }) => {
        // Optimistic Update: Update store immediately
        // We need to merge with other users' items if any, but since we scoped
        // we should handle this carefully.
        // Actually setBin replaces ALL items.
        // So we need to take non-user items + new user items order.

        const otherItems = items.filter(item => item.userId !== username);
        setBin([...otherItems, ...data]);

        // Sync with backend
        const ids = data.map(item => item.id);
        await listeningBinSyncService.reorderAlbums(ids);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Listening Bin</Text>
                    {userItems.length > 0 && (
                        <Pressable testID="bin-clear-button" onPress={handleClear} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </Pressable>
                    )}
                </View>

                {userItems.length === 0 ? (
                    <View testID="bin-empty-state" style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
                        <Text style={styles.emptyText}>Your bin is empty</Text>
                        <Text style={styles.emptySubtext}>Add albums from your collection to start listening.</Text>
                    </View>
                ) : (
                    <DraggableFlatList
                        testID="bin-list"
                        data={userItems}
                        onDragEnd={onDragEnd}
                        keyExtractor={(item, index) => item.frontendId || `${item.id}-${index}`}
                        renderItem={renderItem}
                        containerStyle={styles.listContent}
                        activationDistance={20}
                    />
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
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
        paddingTop: THEME.spacing.xl, // Increased to avoid status bar
        paddingBottom: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.white,
    },
    clearButton: {
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
