// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BinItem as BinItemType } from '@/types';
import { BinItem } from './BinItem';
import { THEME } from '@/constants/theme';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';

interface BinListProps {
    items: BinItemType[];
    username: string | null;
    hostUsername: string | null;
    onRemove: (item: BinItemType) => void;
    onDragEnd: (data: BinItemType[]) => void;
    onPlay?: (item: BinItemType) => void;
    contentContainerStyle?: object;
    emptyComponent?: React.ReactElement | null;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
    canDisplayPlay?: boolean;
    canDisplayDelete?: boolean;
}

export const BinList: React.FC<BinListProps> = ({
    items,
    username,
    hostUsername,
    onRemove,
    onDragEnd,
    onPlay,
    contentContainerStyle,
    emptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
    canDisplayPlay = true,
    canDisplayDelete = true
}) => {
    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<BinItemType>) => (
        <BinItem
            item={item}
            isActive={isActive}
            drag={drag}
            onRemove={onRemove}
            canDelete={canDisplayDelete && (item.userId === username || username === hostUsername)}
            canPlay={canDisplayPlay && username === hostUsername}
            onPlay={onPlay ? (item) => onPlay(item) : (item) => listeningBinSyncService.playAlbum(item)}
        />
    ), [onRemove, username, hostUsername, canDisplayPlay, canDisplayDelete, onPlay]);

    const handleDragEnd = ({ data }: { data: BinItemType[] }) => {
        onDragEnd(data);
    };

    if (items.length === 0 && emptyComponent && !ListHeaderComponent) {
        return <>{emptyComponent}</>;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <DraggableFlatList
                testID="bin-list"
                data={items}
                onDragEnd={handleDragEnd}
                keyExtractor={(item, index) => item.frontendId || `${item.id}-${index}`}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={emptyComponent}
                contentContainerStyle={contentContainerStyle}
                activationDistance={20}
            />
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
