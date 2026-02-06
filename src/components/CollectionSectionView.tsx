import React, { useCallback, useMemo } from 'react';
import { SectionList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { COLLECTION_BOTTOM_PADDING } from '@/constants/layout';
import { Release } from '@/types';
import { BrowseSection } from '@/components/BrowseSection';
import { EmptyCollectionState } from '@/components/EmptyCollectionState';
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

export const CollectionSectionView: React.FC<CollectionSectionViewProps> = React.memo(({
    sections,
    onReleasePress,
    onRefresh,
    refreshing,
    loading,
    isEmpty,
    username
}) => {
    // Fix Issue #3: Memoize section transformation to prevent recreation on every render
    const transformedSections = useMemo(
        () => sections.map(g => ({ ...g, data: [g.data] })),
        [sections]
    );

    // Fix Issue #4: Use stable keys based on section content instead of index
    const keyExtractor = useCallback((item: Release[], index: number) => {
        const section = sections[index];
        return `section-${section.title}-${section.data.length}`;
    }, [sections]);

    const renderItem = useCallback(({ item, section }: any) => (
        <BrowseSection
            title={section.title}
            releases={item}
            onPressRelease={onReleasePress}
        />
    ), [onReleasePress]);

    const renderSectionHeader = useCallback(() => null, []);

    const renderFooter = useCallback(() => {
        if (!loading || isEmpty) return null;
        return <ActivityIndicator color={THEME.colors.primary} style={styles.footer} />;
    }, [loading, isEmpty]);

    const renderEmpty = useCallback(() => {
        if (!isEmpty || loading) return null;
        return <EmptyCollectionState username={username} />;
    }, [isEmpty, loading, username]);

    return (
        <SectionList
            testID="collection-section-list"
            sections={transformedSections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
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
            accessibilityLabel="Collection list"
        />
    );
});

CollectionSectionView.displayName = 'CollectionSectionView';

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: THEME.spacing.xs,
        paddingBottom: COLLECTION_BOTTOM_PADDING,
    },
    footer: {
        marginVertical: THEME.spacing.md,
    },
});

