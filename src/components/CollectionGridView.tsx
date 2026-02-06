import React, { useCallback } from 'react';
import { FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { COLLECTION_BOTTOM_PADDING } from '@/constants/layout';
import { Release } from '@/types';
import { ReleaseCard } from '@/components/ReleaseCard';
import { EmptyCollectionState } from '@/components/EmptyCollectionState';

export interface CollectionGridViewProps {
    releases: Release[];
    numColumns: number;
    onReleasePress: (release: Release) => void;
    onRefresh: () => void;
    refreshing: boolean;
    loading: boolean;
    isEmpty: boolean;
    username: string | null;
}

export const CollectionGridView: React.FC<CollectionGridViewProps> = React.memo(({
    releases,
    numColumns,
    onReleasePress,
    onRefresh,
    refreshing,
    loading,
    isEmpty,
    username
}) => {
    const keyExtractor = useCallback((item: Release) => `${item.id}-${item.instanceId}`, []);

    const renderItem = useCallback(({ item }: { item: Release }) => (
        <ReleaseCard
            release={item}
            onPress={() => onReleasePress(item)}
        />
    ), [onReleasePress]);

    const renderFooter = useCallback(() => {
        if (!loading || isEmpty) return null;
        return <ActivityIndicator color={THEME.colors.primary} style={styles.footer} />;
    }, [loading, isEmpty]);

    const renderEmpty = useCallback(() => {
        if (!isEmpty || loading) return null;
        return <EmptyCollectionState username={username} />;
    }, [isEmpty, loading, username]);

    return (
        <FlatList
            testID="collection-grid-list"
            data={releases}
            numColumns={numColumns}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={THEME.colors.primary}
                    colors={[THEME.colors.primary]}
                />
            }
            ListFooterComponent={renderFooter()}
            ListEmptyComponent={renderEmpty()}
            accessibilityRole="list"
            accessibilityLabel="Collection grid"
        />
    );
});

CollectionGridView.displayName = 'CollectionGridView';

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: THEME.spacing.xs,
        paddingBottom: COLLECTION_BOTTOM_PADDING,
    },
    footer: {
        marginVertical: THEME.spacing.md,
    },
});

