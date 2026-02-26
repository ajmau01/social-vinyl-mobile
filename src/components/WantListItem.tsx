import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { WantListItem } from '@/types';

export function WantListItemRow({ item, onRemove }: { item: WantListItem; onRemove: () => void }) {
    const swipeRef = useRef<Swipeable>(null);

    const renderRightActions = () => (
        <TouchableOpacity style={styles.deleteAction} onPress={() => { swipeRef.current?.close(); onRemove(); }}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
    );

    const date = new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const partyLabel = item.hostUsername ? `Heard at ${item.hostUsername}'s party · ${date}` : `Heard ${date}`;

    return (
        <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={40}>
            <View style={styles.row}>
                {item.albumArtUrl
                    ? <Image source={{ uri: item.albumArtUrl }} style={styles.art} />
                    : <View style={[styles.art, styles.artFallback]}><Ionicons name="disc-outline" size={20} color={THEME.colors.textDim} /></View>
                }
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.releaseTitle}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                    <Text style={styles.party} numberOfLines={1}>{partyLabel}</Text>
                </View>
            </View>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: THEME.colors.surface, gap: 12 },
    art: { width: 48, height: 48, borderRadius: 6 },
    artFallback: { backgroundColor: THEME.colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1 },
    title: { color: THEME.colors.text, fontSize: 14, fontWeight: '600' },
    artist: { color: THEME.colors.textDim, fontSize: 12, marginTop: 2 },
    party: { color: THEME.colors.textMuted, fontSize: 11, marginTop: 2 },
    deleteAction: { backgroundColor: THEME.colors.status.error, width: 64, justifyContent: 'center', alignItems: 'center' },
});
