import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { BlurView } from 'expo-blur';
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
        <View style={styles.container}>
            <BlurView intensity={20} tint="light" style={styles.blur}>
                <View style={styles.content}>
                    {options.map((option) => {
                        const isSelected = selected === option;
                        return (
                            <TouchableOpacity
                                key={option}
                                style={[styles.option, isSelected && styles.selectedOption]}
                                onPress={() => handlePress(option)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.text, isSelected && styles.selectedText]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.md,
        marginHorizontal: THEME.spacing.md,
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    blur: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        padding: 4,
    },
    option: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: THEME.radius.md,
    },
    selectedOption: {
        backgroundColor: THEME.colors.glass, // Using theme glass
        borderColor: THEME.colors.glassBorder,
        borderWidth: 1,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.colors.textDim,
    },
    selectedText: {
        color: THEME.colors.white,
        fontWeight: 'bold',
    },
});
