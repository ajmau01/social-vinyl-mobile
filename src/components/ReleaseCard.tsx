import { View, Text, StyleSheet, Image, Pressable, StyleProp, ViewStyle } from 'react-native';
import { THEME } from '@/constants/theme';
import { Release } from '@/services/DatabaseService';

interface ReleaseCardProps {
    release: Release;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const ReleaseCard = ({ release, onPress, style }: ReleaseCardProps) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                style, // valid override
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                {release.thumb_url ? (
                    <Image
                        source={{ uri: release.thumb_url }}
                        style={styles.image}
                        resizeMode="cover"
                    // Add fade-in animation logic if desired later
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{release.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{release.artist}</Text>
                {release.year ? <Text style={styles.year}>{release.year}</Text> : null}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: THEME.spacing.xs,
        maxWidth: '48%', // For 2-column grid
        backgroundColor: THEME.colors.glass,
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    pressed: {
        opacity: 0.8,
    },
    imageContainer: {
        aspectRatio: 1,
        width: '100%',
        backgroundColor: THEME.colors.surfaceLight, // Fallback while loading
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
    info: {
        padding: 6, // Reduced from THEME.spacing.sm
    },
    title: {
        color: THEME.colors.white,
        fontSize: 11, // Reduced from 12
        fontWeight: 'bold',
        marginBottom: 1,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 10, // Reduced from 11
        marginBottom: 1,
    },
    year: {
        color: THEME.colors.primary,
        fontSize: 10,
        fontWeight: '600',
    },
});
