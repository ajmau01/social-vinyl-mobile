import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';

export interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...'
}) => {
    return (
        <View style={styles.searchContainer}>
            <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor={THEME.colors.textDim}
                    value={value}
                    onChangeText={onChangeText}
                />
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
    },
    searchBlur: {
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
    },
    searchInput: {
        padding: THEME.spacing.md,
        color: THEME.colors.white,
        fontSize: 16,
    },
});
