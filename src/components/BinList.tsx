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
    contentContainerStyle?: object;
    emptyComponent?: React.ReactNode;
}

export const BinList: React.FC<BinListProps> = ({
    items,
    username,
    hostUsername,
    onRemove,
    onDragEnd,
    contentContainerStyle,
    emptyComponent
}) => {
    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<BinItemType>) => (
        <BinItem
            item={item}
            isActive={isActive}
            drag={drag}
            onRemove={onRemove}
            canDelete={item.userId === username || username === hostUsername}
            canPlay={username === hostUsername}
            onPlay={(item) => listeningBinSyncService.playAlbum(item)}
        />
    ), [onRemove, username, hostUsername]);

    const handleDragEnd = ({ data }: { data: BinItemType[] }) => {
        onDragEnd(data);
    };

    if (items.length === 0 && emptyComponent) {
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
                containerStyle={contentContainerStyle}
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
