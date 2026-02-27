// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { NowPlaying } from '@/types';

interface NowPlayingHeroProps {
    nowPlaying: NowPlaying | null;
    onStop?: () => void;
    showStopButton?: boolean;
}

export const NowPlayingHero: React.FC<NowPlayingHeroProps> = ({
    nowPlaying,
    onStop,
    showStopButton = false
}) => {
    return (
        <View style={styles.container}>
            {/* Hero Section: SQUARE Artwork */}
            <View style={styles.heroSection}>
                <View style={styles.artworkWrapper}>
                    {nowPlaying?.albumArt ? (
                        <View style={styles.artworkContainer}>
                            <Image
                                source={{ uri: nowPlaying.albumArt }}
                                style={styles.artworkImage}
                                resizeMode="cover"
                            />
                            {/* X Overlay to Stop Playback */}
                            {showStopButton && onStop && (
                                <Pressable
                                    style={styles.stopButtonOverlay}
                                    onPress={onStop}
                                    hitSlop={15}
                                >
                                    <Ionicons name="close-circle" size={36} color="rgba(255, 255, 255, 0.9)" />
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        <View style={styles.artworkPlaceholder}>
                            <Ionicons name="disc-outline" size={100} color={THEME.colors.textMuted} />
                        </View>
                    )}
                </View>
            </View>

            {/* Metadata Section: Clean Typography Below Art */}
            <View style={styles.metadataSection}>
                <Text numberOfLines={1} style={styles.trackTitle}>
                    {nowPlaying?.album || 'Nothing Playing'}
                </Text>
                <Text numberOfLines={1} style={styles.artistInfo}>
                    {nowPlaying ? nowPlaying.artist : 'Start the party by picking a record'}
                </Text>
                {nowPlaying?.playedBy && (
                    <Text style={styles.attribution}>
                        Added by {nowPlaying.playedBy}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: THEME.spacing.lg,
    },
    artworkWrapper: {
        width: '85%',
        aspectRatio: 1,
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
        backgroundColor: THEME.colors.surfaceLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    artworkContainer: {
        flex: 1,
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    stopButtonOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    artworkPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.surfaceLight,
    },
    metadataSection: {
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.xl,
        marginTop: THEME.spacing.sm,
        marginBottom: THEME.spacing.lg,
    },
    trackTitle: {
        color: THEME.colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    artistInfo: {
        color: THEME.colors.textDim,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    attribution: {
        color: THEME.colors.textMuted,
        fontSize: 12,
        fontStyle: 'italic',
    },
});
