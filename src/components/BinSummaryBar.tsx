import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export function BinSummaryBar({ count, onPress }: { count: number; onPress: () => void }) {
    const label = count === 1 ? '1 in the bin · Keep browsing' : `${count} in the bin · Keep browsing`;
    return (
        <TouchableOpacity style={styles.bar} onPress={onPress} activeOpacity={0.8}>
            <Ionicons name="musical-notes" size={14} color={THEME.colors.primary} />
            <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: THEME.colors.primary + '15', borderBottomWidth: 1, borderBottomColor: THEME.colors.primary + '30' },
    text: { color: THEME.colors.primary, fontSize: 13, fontWeight: '600' },
});
