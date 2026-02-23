import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { BinItem as BinItemType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { ScaleDecorator } from 'react-native-draggable-flatlist';

interface Props {
    item: BinItemType;
    isActive: boolean;
    drag: () => void;
    onRemove: (item: BinItemType) => void;
    canDelete?: boolean;
    onPlay?: (item: BinItemType) => void;
    canPlay?: boolean;
}

export const BinItem = ({ item, isActive, drag, onRemove, canDelete = true, onPlay, canPlay = false }: Props) => {
    return (
        <ScaleDecorator>
            <Pressable
                disabled={isActive}
                style={[
                    styles.card,
                    isActive && styles.activeCard
                ]}
            >
                <View style={styles.contentContainer}>
                    {/* Drag Handle */}
                    <Pressable onPressIn={drag} hitSlop={15} style={styles.dragHandle}>
                        <Ionicons name="reorder-two" size={24} color={THEME.colors.textDim} />
                    </Pressable>

                    <Image source={{ uri: item.thumb_url || '' }} style={styles.thumbnail} />
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.meta}>
                                {item.format} • {item.year}
                            </Text>
                            {/* Sync Status Indicator */}
                            {item.status === 'pending' && (
                                <View style={styles.statusRow}>
                                    <Ionicons name="cloud-upload-outline" size={12} color={THEME.colors.status.warning} />
                                    <Text style={styles.statusPending}>Syncing...</Text>
                                </View>
                            )}
                            {item.status === 'error' && (
                                <View style={styles.statusRow}>
                                    <Ionicons name="alert-circle-outline" size={12} color={THEME.colors.status.error} />
                                    <Text style={styles.statusError}>Sync Failed</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Play Button (Host Only) */}
                    {canPlay && (
                        <Pressable
                            onPress={() => onPlay && onPlay(item)}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                            hitSlop={8}
                        >
                            <Ionicons name="play-circle" size={32} color={THEME.colors.primary} />
                        </Pressable>
                    )}

                    {canDelete && (
                        <Pressable
                            onPress={() => onRemove(item)}
                            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.pressed]}
                            hitSlop={8}
                        >
                            <Ionicons name="trash-outline" size={20} color={THEME.colors.status.error} />
                        </Pressable>
                    )}
                </View>
            </Pressable>
        </ScaleDecorator>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.colors.glass,
        borderRadius: THEME.radius.md,
        marginBottom: THEME.spacing.sm,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        overflow: 'hidden'
    },
    activeCard: {
        backgroundColor: THEME.colors.glass, // Fallback to glass
        borderColor: THEME.colors.primary,
        shadowColor: THEME.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        opacity: 0.9
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.sm,
    },
    dragHandle: {
        paddingRight: THEME.spacing.sm,
        justifyContent: 'center',
        alignItems: 'center'
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
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    meta: {
        color: THEME.colors.textDim,
        fontSize: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    statusPending: {
        color: THEME.colors.status.warning,
        fontSize: 10,
        marginLeft: 4,
        fontStyle: 'italic'
    },
    statusError: {
        color: THEME.colors.status.error,
        fontSize: 10,
        marginLeft: 4,
        fontStyle: 'italic'
    },
    actionButton: {
        padding: THEME.spacing.xs,
        marginLeft: THEME.spacing.xs,
    },
    deleteButton: {
        marginLeft: 0,
    },
    pressed: {
        opacity: 0.7,
    },
});
