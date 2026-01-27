import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { Release } from '@/services/DatabaseService';

interface ReleaseCardProps {
    release: Release;
    onPress?: () => void;
}

export const ReleaseCard = ({ release, onPress }: ReleaseCardProps) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
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
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: THEME.spacing.xs,
        maxWidth: '48%', // For 2-column grid
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pressed: {
        opacity: 0.8,
    },
    imageContainer: {
        aspectRatio: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
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
        padding: THEME.spacing.sm,
    },
    title: {
        color: THEME.colors.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
});
