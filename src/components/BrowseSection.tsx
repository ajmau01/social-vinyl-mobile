import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { ReleaseCard } from './ReleaseCard';

interface BrowseSectionProps {
    title: string;
    releases: Release[];
    onPressRelease?: (release: Release) => void;
}

export const BrowseSection: React.FC<BrowseSectionProps> = ({
    title,
    releases,
    onPressRelease,
}) => {
    if (releases.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.count}>{releases.length}</Text>
            </View>

            <FlatList
                data={releases}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <ReleaseCard
                            release={item}
                            onPress={() => onPressRelease?.(item)}
                            style={{ maxWidth: '100%' }} // Override grid layout
                        />
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
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
        paddingHorizontal: THEME.spacing.md,
        marginBottom: THEME.spacing.sm,
        gap: THEME.spacing.sm,
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
