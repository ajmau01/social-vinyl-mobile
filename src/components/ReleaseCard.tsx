// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { Release } from '@/types';

interface ReleaseCardProps {
    release: Release;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: StyleProp<ViewStyle>;
    guestMode?: boolean;
    isWanted?: boolean;
    onWantList?: () => void;
}

export const ReleaseCard = ({ release, onPress, onLongPress, style, guestMode, isWanted, onWantList }: ReleaseCardProps) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                style, // valid override
                pressed && styles.pressed
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={500}
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

                {!guestMode && release.isSaved && (
                    <Animated.View
                        entering={ZoomIn.duration(200)}
                        exiting={ZoomOut.duration(200)}
                        style={styles.bookmarkOverlay}
                    >
                        <View style={styles.bookmarkBackground}>
                            <Ionicons name="bookmark" size={14} color={THEME.colors.gold} />
                        </View>
                    </Animated.View>
                )}
                {guestMode && (
                    <TouchableOpacity
                        style={styles.wantListOverlay}
                        onPress={(e) => { e.stopPropagation(); onWantList?.(); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <View style={styles.wantListBackground}>
                            <Ionicons
                                name={isWanted ? 'pricetag' : 'pricetag-outline'}
                                size={14}
                                color={isWanted ? THEME.colors.primary : THEME.colors.textDim}
                            />
                        </View>
                    </TouchableOpacity>
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
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 11,
        marginBottom: 2,
    },
    year: {
        color: THEME.colors.primary,
        fontSize: 10,
        fontWeight: '600',
    },
    bookmarkOverlay: {
        position: 'absolute',
        top: THEME.spacing.xs,
        left: THEME.spacing.xs,
        zIndex: 10,
    },
    bookmarkBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    wantListOverlay: {
        position: 'absolute',
        bottom: THEME.spacing.xs,
        right: THEME.spacing.xs,
        zIndex: 10,
    },
    wantListBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    },
});
