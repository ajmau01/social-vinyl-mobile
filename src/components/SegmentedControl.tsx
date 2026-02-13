import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { THEME } from '@/constants/theme';

interface SegmentedControlProps {
    options: string[];
    selected: string;
    onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onChange }) => {
    const handlePress = (option: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onChange(option);
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
            style={styles.scrollView}
        >
            {options.map((option) => {
                const isSelected = selected === option;
                return (
                    <TouchableOpacity
                        key={option}
                        testID={`segment-${option.toLowerCase().replace(' ', '-')}`}
                        style={[styles.chip, isSelected && styles.activeChip]}
                        onPress={() => handlePress(option)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        marginBottom: THEME.spacing.md,
        marginHorizontal: THEME.spacing.md,
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: THEME.spacing.md,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    activeChip: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.colors.textDim,
    },
    activeChipText: {
        color: THEME.colors.white,
        fontWeight: '700',
    },
});
