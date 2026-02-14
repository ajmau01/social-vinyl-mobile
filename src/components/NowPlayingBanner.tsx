import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    ZoomIn,
    ZoomOut
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useWebSocket } from '@/hooks';

export const NowPlayingBanner = () => {
    const { nowPlaying, isConnected, isConnecting } = useWebSocket();
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (isConnected) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            pulse.value = 1;
        }
    }, [isConnected]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: isConnected ? 0.6 : 1
    }));

    if (!nowPlaying && !isConnecting && !isConnected) return null;

    return (
        <LinearGradient
            colors={['rgba(28, 28, 30, 0.95)', 'rgba(15, 16, 22, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.wrapper}
        >
            <Animated.View layout={LinearTransition} style={styles.container}>
                <View style={styles.content}>
                    {/* Album Art Container */}
                    <View
                        style={styles.artwork}
                    >
                        {nowPlaying?.albumArt ? (
                            <Animated.Image
                                entering={FadeIn.duration(400)}
                                key={nowPlaying.albumArt}
                                source={{ uri: nowPlaying.albumArt }}
                                style={styles.artworkImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.artworkPlaceholder} />
                        )}
                    </View>

                    {/* Info Container */}
                    <View style={styles.info}>
                        <Animated.Text
                            key={nowPlaying?.track ? `track-${nowPlaying.track}` : 'track-empty'}
                            entering={FadeIn.duration(300)}
                            style={styles.track}
                            numberOfLines={1}
                        >
                            {nowPlaying?.track || (isConnecting ? 'Connecting...' : 'Waiting for Track...')}
                        </Animated.Text>
                        <Animated.Text
                            key={nowPlaying?.artist ? `artist-${nowPlaying.artist}` : 'artist-empty'}
                            entering={FadeIn.delay(100).duration(300)}
                            style={styles.artist}
                            numberOfLines={1}
                        >
                            {nowPlaying?.artist || (isConnecting ? 'Establishing WebSocket...' : 'Not Playing')}
                        </Animated.Text>
                    </View>

                    {/* Status Indicator Container */}
                    <View style={styles.statusContainer}>
                        <Animated.View style={[
                            styles.statusDot,
                            isConnected ? styles.statusConnected : styles.statusDisconnected,
                            isConnecting && styles.statusConnecting,
                            pulseStyle
                        ]} />
                        {isConnected && (
                            <Animated.View
                                entering={ZoomIn}
                                exiting={ZoomOut}
                                style={[styles.statusPulse, pulseStyle]}
                            />
                        )}
                    </View>
                </View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        borderTopLeftRadius: THEME.radius.lg,
        borderTopRightRadius: THEME.radius.lg,
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        // backgroundColor removed as LinearGradient handles it
    },
    container: {
        paddingVertical: 10, // Tighter padding for space efficiency
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.md,
        gap: THEME.spacing.md,
    },
    artwork: {
        width: 38, // Slightly smaller
        height: 38,
        borderRadius: THEME.radius.sm,
        backgroundColor: THEME.colors.surfaceLight,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        fontSize: 13, // Tighter font
        fontWeight: 'bold',
        letterSpacing: 0.1,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 11,
        marginTop: 1,
    },
    statusContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        zIndex: 2,
    },
    statusPulse: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: THEME.colors.status.success,
        opacity: 0.4,
        zIndex: 1,
    },
    statusConnected: {
        backgroundColor: THEME.colors.status.success,
    },
    statusConnecting: {
        backgroundColor: THEME.colors.status.warning,
    },
    statusDisconnected: {
        backgroundColor: THEME.colors.textMuted,
    },
});
