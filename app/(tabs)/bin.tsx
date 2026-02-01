import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView, Alert } from 'react-native';
import { THEME } from '@/constants/theme';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { useSessionStore } from '@/store/useSessionStore';
import { BinItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function BinScreen() {
    const { username } = useSessionStore();
    const { items, removeItem, clearBin } = useListeningBinStore();

    // SCOPING: Only show items for the current user
    const userItems = useMemo(() =>
        items.filter(item => item.userId === username),
        [items, username]);

    const handleRemove = (item: BinItem) => {
        if (!username) return;
        Alert.alert(
            'Remove Album',
            `Are you sure you want to remove "${item.title}" from your Listening Bin?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.id, username) },
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
                { text: 'Clear All', style: 'destructive', onPress: () => clearBin(username) },
            ]
        );
    };

    const renderItem = ({ item }: { item: BinItem }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.thumb_url || '' }} style={styles.thumbnail} />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                    {item.format} • {item.year}
                </Text>
            </View>
            <Pressable
                onPress={() => handleRemove(item)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            >
                <Ionicons name="trash-outline" size={20} color={THEME.colors.status.error} />
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Listening Bin</Text>
                    {userItems.length > 0 && (
                        <Pressable onPress={handleClear} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </Pressable>
                    )}
                </View>

                {userItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
                        <Text style={styles.emptyText}>Your bin is empty</Text>
                        <Text style={styles.emptySubtext}>Add albums from your collection to start listening.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={userItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </SafeAreaView>
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
        paddingVertical: THEME.spacing.md,
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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.glass,
        borderRadius: THEME.radius.md,
        padding: THEME.spacing.sm,
        marginBottom: THEME.spacing.sm,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: THEME.radius.sm,
    },
    info: {
        flex: 1,
        marginLeft: THEME.spacing.md,
    },
    title: {
        color: THEME.colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
    meta: {
        color: THEME.colors.textDim,
        fontSize: 10,
        marginTop: 2,
    },
    removeButton: {
        padding: THEME.spacing.sm,
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
    pressed: {
        opacity: 0.7,
    },
});
