import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { ReleaseCard } from './ReleaseCard';

interface BrowseSectionProps {
    title: string;
    releases: Release[];
    onPress?: (release: Release) => void;
    onLongPress?: (release: Release) => void;
    style?: StyleProp<ViewStyle>;
}

export const BrowseSection: React.FC<BrowseSectionProps> = ({
    title,
    releases,
    onPress,
    onLongPress,
}) => {
    if (releases.length === 0) return null;

    const renderItem = useCallback(({ item }: { item: Release }) => (
        <View style={styles.cardWrapper}>
            <ReleaseCard
                release={item}
                onPress={() => onPress?.(item)}
                onLongPress={() => onLongPress?.(item)}
                style={{ maxWidth: '100%' }}
            />
        </View>
    ), [onPress, onLongPress]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.count}>{releases.length}</Text>
            </View>

            <FlatList
                data={releases}
                renderItem={renderItem}
                keyExtractor={(item) => item.instanceId.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                windowSize={5} // Optimize for many horizontal lists
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingLeft: THEME.spacing.md - 4, // Offset by border width to maintain text alignment
        paddingRight: THEME.spacing.md,
        marginBottom: THEME.spacing.sm,
        gap: THEME.spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: THEME.colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.colors.text,
    },
    count: {
        fontSize: 14,
        color: THEME.colors.textDim,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: THEME.spacing.md,
        gap: THEME.spacing.md,
    },
    cardWrapper: {
        width: 160, // Fixed width for horizontal items
    }
});
