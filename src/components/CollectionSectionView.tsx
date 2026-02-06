import React from 'react';
import { View, Text, SectionList, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';
import { BrowseSection } from '@/components/BrowseSection';
import { CollectionSection } from '@/hooks/useGroupedReleases';

export interface CollectionSectionViewProps {
    sections: CollectionSection[];
    onReleasePress: (release: Release) => void;
    onRefresh: () => void;
    refreshing: boolean;
    loading: boolean;
    isEmpty: boolean;
    username: string | null;
}

export const CollectionSectionView: React.FC<CollectionSectionViewProps> = ({
    sections,
    onReleasePress,
    onRefresh,
    refreshing,
    loading,
    isEmpty,
    username
}) => {
    const renderEmptyState = () => {
        if (!isEmpty || loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.textDim} />
                <Text style={styles.emptyText}>
                    {!username || username === 'solo_user' ? 'No collection synced' : 'Your collection is empty'}
                </Text>
                <Text style={styles.emptySubtext}>
                    {!username || username === 'solo_user'
                        ? 'Sync your Discogs collection in Solo Mode to start browsing.'
                        : 'Try syncing your collection or adjusting your search.'}
                </Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loading || isEmpty) return null;
        return <ActivityIndicator color={THEME.colors.primary} />;
    };

    return (
        <SectionList
            sections={sections.map(g => ({ ...g, data: [g.data] }))}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, section }) => (
                <BrowseSection
                    title={section.title}
                    releases={item}
                    onPressRelease={onReleasePress}
                />
            )}
            renderSectionHeader={() => null}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            refreshControl={
                <View style={{ paddingTop: 20 }}>
                    {refreshing && <ActivityIndicator color={THEME.colors.primary} />}
                </View>
            }
            onRefresh={onRefresh}
            refreshing={refreshing}
            ListFooterComponent={renderFooter()}
            ListEmptyComponent={renderEmptyState()}
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: THEME.spacing.xs,
        paddingBottom: 180, // Increased to account for banner + tab bar
    },
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
