import React, { useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({
    value,
    onChangeText,
    placeholder = 'Search...'
}) => {
    const handleClear = useCallback(() => {
        onChangeText('');
    }, [onChangeText]);

    return (
        <View style={styles.searchContainer}>
            <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        testID="search-bar-input"
                        style={styles.searchInput}
                        placeholder={placeholder}
                        placeholderTextColor={THEME.colors.textDim}
                        value={value}
                        onChangeText={onChangeText}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        clearButtonMode="never"
                        enablesReturnKeyAutomatically={true}
                        accessibilityRole="search"
                        accessibilityLabel="Search artists or albums"
                        accessibilityHint="Type to filter your collection"
                    />
                    {value.length > 0 && (
                        <TouchableOpacity
                            testID="search-bar-clear-button"
                            onPress={handleClear}
                            style={styles.clearButton}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search"
                            accessibilityHint="Clears the search text"
                        >
                            <Ionicons name="close-circle" size={20} color={THEME.colors.textDim} />
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>
        </View>
    );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
    },
    searchBlur: {
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        padding: THEME.spacing.md,
        color: THEME.colors.white,
        fontSize: 16,
    },
    clearButton: {
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.sm,
    },
});
