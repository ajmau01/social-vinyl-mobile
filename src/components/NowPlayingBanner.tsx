import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSessionStore } from '@/store/useSessionStore';
import { THEME } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NowPlayingBanner = () => {
    const { nowPlaying, isConnected, isConnecting } = useSessionStore();

    if (!nowPlaying && !isConnecting && !isConnected) return null;

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={80} tint="dark" style={styles.container}>
                <View style={styles.content}>
                    {/* Album Art Placeholder or Image */}
                    <View style={styles.artwork}>
                        {nowPlaying?.coverInfo?.pixelUri ? (
                            <Image
                                source={{ uri: nowPlaying.coverInfo.pixelUri }}
                                style={styles.artworkImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.artworkPlaceholder} />
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text style={styles.track} numberOfLines={1}>
                            {nowPlaying?.title || 'Waiting for Track...'}
                        </Text>
                        <Text style={styles.artist} numberOfLines={1}>
                            {nowPlaying?.artist || (isConnecting ? 'Connecting...' : 'Not Playing')}
                        </Text>
                    </View>

                    {/* Status Indicator */}
                    <View style={[
                        styles.statusDot,
                        isConnected ? styles.statusConnected : styles.statusDisconnected,
                        isConnecting && styles.statusConnecting
                    ]} />
                </View>
                <SafeAreaView edges={['bottom']} />
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        borderTopLeftRadius: THEME.radius.lg,
        borderTopRightRadius: THEME.radius.lg,
        borderTopWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    container: {
        paddingTop: THEME.spacing.md,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xs, // Reduced because SafeAreaView adds padding
        gap: THEME.spacing.md,
    },
    artwork: {
        width: 42,
        height: 42,
        borderRadius: THEME.radius.sm,
        backgroundColor: THEME.colors.surfaceLight,
        overflow: 'hidden',
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    artworkPlaceholder: {
        flex: 1,
        backgroundColor: THEME.colors.surfaceLight,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    track: {
        color: THEME.colors.white,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusConnected: {
        backgroundColor: '#00ff44', // Bright green for success
        shadowColor: '#00ff44',
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    statusConnecting: {
        backgroundColor: '#ffaa00', // Orange
    },
    statusDisconnected: {
        backgroundColor: THEME.colors.textMuted,
    },
});
