// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { WantListItem } from '@/types';
import { WantListItemRow } from '@/components/WantListItem';
import { getWantList, shareWantList } from '@/utils/wantList';
import { DatabaseService } from '@/services/DatabaseService';

export default function WantListScreen() {
    const router = useRouter();
    const [items, setItems] = useState<WantListItem[]>([]);

    const load = useCallback(async () => {
        setItems(await getWantList());
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRemove = useCallback(async (releaseId: number) => {
        await DatabaseService.getInstance().removeFromWantList(releaseId);
        load();
    }, [load]);

    const sections = useMemo(() => {
        const map = new Map<string, { title: string; data: WantListItem[] }>();
        for (const item of items) {
            const key = item.sessionId ?? 'standalone';
            if (!map.has(key)) {
                const date = new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const title = item.sessionName ? `${item.sessionName} · ${date}`
                    : item.hostUsername ? `${item.hostUsername}'s Party · ${date}` : date;
                map.set(key, { title, data: [] });
            }
            map.get(key)!.data.push(item);
        }
        return Array.from(map.values());
    }, [items]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{
                headerShown: true,
                title: `Your Want List${items.length > 0 ? ` (${items.length})` : ''}`,
                headerStyle: { backgroundColor: THEME.colors.background },
                headerTitleStyle: { color: THEME.colors.text },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="close" size={24} color={THEME.colors.text} />
                    </TouchableOpacity>
                ),
                headerRight: items.length > 0 ? () => (
                    <TouchableOpacity onPress={() => shareWantList(items)} style={styles.headerBtn}>
                        <Ionicons name="share-outline" size={22} color={THEME.colors.primary} />
                    </TouchableOpacity>
                ) : undefined,
            }} />

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="pricetag-outline" size={48} color={THEME.colors.textDim} />
                    <Text style={styles.emptyTitle}>No records bookmarked yet</Text>
                    <Text style={styles.emptySubtitle}>Tap the tag icon on any record while browsing a party to save it here.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <WantListItemRow item={item} onRemove={() => handleRemove(item.releaseId)} />}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text></View>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            {items.length > 0 && (
                <TouchableOpacity style={styles.shareFooter} onPress={() => shareWantList(items)}>
                    <Ionicons name="share-outline" size={16} color={THEME.colors.primary} />
                    <Text style={styles.shareText}>Share this list</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    headerBtn: { padding: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    emptyTitle: { color: THEME.colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
    emptySubtitle: { color: THEME.colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    sectionHeader: { padding: 12, paddingTop: 20, backgroundColor: THEME.colors.background },
    sectionTitle: { color: THEME.colors.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: THEME.colors.glassBorder, marginLeft: 72 },
    shareFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: THEME.colors.glassBorder },
    shareText: { color: THEME.colors.primary, fontSize: 15, fontWeight: '600' },
});
