import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { COPY } from '@/constants/copy';

export type SessionMode = 'party' | 'live' | 'solo';

interface SessionModeSelectorProps {
    selectedMode: SessionMode;
    onModeChange: (mode: SessionMode) => void;
}

interface ModeOption {
    mode: SessionMode;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    desc: string;
}

const MODE_OPTIONS: ModeOption[] = [
    {
        mode: 'party',
        icon: 'people-outline',
        title: COPY.MODE_PARTY_TITLE,
        desc: COPY.MODE_PARTY_DESC,
    },
    {
        mode: 'live',
        icon: 'radio-outline',
        title: COPY.MODE_LIVE_TITLE,
        desc: COPY.MODE_LIVE_DESC,
    },
    {
        mode: 'solo',
        icon: 'headset-outline',
        title: COPY.MODE_SOLO_TITLE,
        desc: COPY.MODE_SOLO_DESC,
    },
];

export function SessionModeSelector({ selectedMode, onModeChange }: SessionModeSelectorProps) {
    return (
        <View style={styles.container}>
            {MODE_OPTIONS.map(({ mode, icon, title, desc }) => {
                const selected = mode === selectedMode;
                return (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.card, selected && styles.cardSelected]}
                        onPress={() => onModeChange(mode)}
                        activeOpacity={0.7}
                        testID={`mode-card-${mode}`}
                    >
                        <Ionicons
                            name={icon}
                            size={24}
                            color={selected ? THEME.colors.primary : THEME.colors.textDim}
                            style={styles.icon}
                        />
                        <View style={styles.textBlock}>
                            <Text style={[styles.title, selected && styles.titleSelected]}>
                                {title}
                            </Text>
                            <Text style={styles.desc}>{desc}</Text>
                        </View>
                        {selected && (
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={THEME.colors.primary}
                                style={styles.checkmark}
                            />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 14,
        padding: 16,
    },
    cardSelected: {
        borderColor: THEME.colors.primary,
        backgroundColor: THEME.colors.primary + '12',
    },
    icon: {
        marginRight: 14,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: 2,
    },
    titleSelected: {
        color: THEME.colors.primary,
    },
    desc: {
        fontSize: 13,
        color: THEME.colors.textDim,
        lineHeight: 18,
    },
    checkmark: {
        marginLeft: 8,
    },
});
