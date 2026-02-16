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
}

export const BinItem = ({ item, isActive, drag, onRemove, canDelete = true }: Props) => {
    return (
        <ScaleDecorator>
            <Pressable
                onLongPress={drag}
                disabled={isActive}
                style={[
                    styles.card,
                    isActive && styles.activeCard
                ]}
            >
                <View style={styles.contentContainer}>
                    {/* Drag Handle */}
                    <View style={styles.dragHandle}>
                        <Ionicons name="reorder-two" size={24} color={THEME.colors.textDim} />
                    </View>

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
                                <Text style={styles.statusPending}>Syncing...</Text>
                            )}
                            {item.status === 'error' && (
                                <Text style={styles.statusError}>Sync Failed</Text>
                            )}
                        </View>
                    </View>
                    {canDelete && (
                        <Pressable
                            onPress={() => onRemove(item)}
                            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
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
    statusPending: {
        color: THEME.colors.status.warning,
        fontSize: 10,
        marginLeft: 8,
        fontStyle: 'italic'
    },
    statusError: {
        color: THEME.colors.status.error,
        fontSize: 10,
        marginLeft: 8,
        fontStyle: 'italic'
    },
    removeButton: {
        padding: THEME.spacing.sm,
    },
    pressed: {
        opacity: 0.7,
    },
});
