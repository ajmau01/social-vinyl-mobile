import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface EmptyCollectionStateProps {
    username: string | null;
}

export const EmptyCollectionState: React.FC<EmptyCollectionStateProps> = React.memo(({ username }) => {
    const SOLO_MODE_USERNAME = 'solo_user';
    const isSoloMode = !username || username === SOLO_MODE_USERNAME;

    return (
        <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
            <Text style={styles.emptyText}>
                {isSoloMode ? 'No collection synced' : 'Your collection is empty'}
            </Text>
            <Text style={styles.emptySubtext}>
                {isSoloMode
                    ? 'Sync your Discogs collection in Solo Mode to start browsing.'
                    : 'Try syncing your collection or adjusting your search.'}
            </Text>
        </View>
    );
});

EmptyCollectionState.displayName = 'EmptyCollectionState';

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
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
        lineHeight: 20,
    },
});
