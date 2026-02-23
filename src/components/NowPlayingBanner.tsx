import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
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
    ZoomOut,
    interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { useWebSocket } from '@/hooks';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { logger } from '@/utils/logger';
import { ProgressRing } from './ProgressRing';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';

interface NowPlayingBannerProps {
    variant?: 'compact' | 'full';
}

export const NowPlayingBanner: React.FC<NowPlayingBannerProps> = ({ variant = 'compact' }) => {
    const { nowPlaying, isConnected, isConnecting } = useWebSocket();
    const { username, hostUsername } = useSessionStore();
    const { items: binItems } = useListeningBinStore();
    const isHost = !!username && username === hostUsername;

    // Fix Issue #126: Move shared values and styles to top level to avoid conditional hook errors
    const heartScale = useSharedValue(1);

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const progress = useMemo(() => {
        if (!nowPlaying?.duration || !nowPlaying?.position) return 0;
        return Math.min(nowPlaying.position / nowPlaying.duration, 1);
    }, [nowPlaying?.position, nowPlaying?.duration]);

    const handleLike = async () => {
        if (!nowPlaying) return;

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate heart
        heartScale.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );

        await listeningBinSyncService.likeCurrentAlbum();
    };

    const handleStop = async () => {
        if (!isHost) return;

        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await listeningBinSyncService.stopPlayback();
        } catch (error) {
            logger.error('[NowPlaying] Stop playback failed', error);
        }
    };

    const handlePlay = async () => {
        if (!isHost || binItems.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await listeningBinSyncService.playAlbum(binItems[0]);
    };

    if (variant === 'compact' && !nowPlaying && !isConnecting && !isConnected) return null;

    if (variant === 'full') {
        const hasItems = binItems.length > 0;
        return (
            <View style={styles.fullContainer}>
                <View style={styles.fullArtworkContainer}>
                    {nowPlaying?.albumArt ? (
                        <Image
                            source={{ uri: nowPlaying.albumArt }}
                            style={styles.fullArtworkImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.fullArtworkPlaceholder}>
                            <Ionicons name="disc-outline" size={100} color={THEME.colors.textMuted} />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handlePlay}
                    disabled={!hasItems}
                    style={[styles.fullPlayButton, !hasItems && styles.playButtonDisabled]}
                >
                    <Ionicons name="play-circle" size={80} color={THEME.colors.primary} />
                </TouchableOpacity>

                <View style={styles.fullInfo}>
                    <Text style={styles.fullTrack} numberOfLines={2}>
                        {nowPlaying?.track || (hasItems ? 'Ready to play' : 'Waiting for album...')}
                    </Text>
                    <Text style={styles.fullArtist} numberOfLines={1}>
                        {nowPlaying?.artist || (hasItems ? 'Tap drop the needle' : 'Add to your bin')}
                    </Text>
                </View>

                {nowPlaying && !hasItems && (
                    <Text style={styles.dropNeedleHint}>Ready to play — tap when you drop the needle</Text>
                )}
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['rgba(28, 28, 30, 0.95)', 'rgba(15, 16, 22, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.wrapper}
        >
            <Animated.View layout={LinearTransition} style={styles.container}>
                <View style={styles.content}>

                    {/* Left: Progress + Artwork */}
                    <View style={styles.artworkContainer}>
                        <ProgressRing
                            size={46}
                            strokeWidth={3}
                            position={nowPlaying?.position || 0}
                            duration={nowPlaying?.duration || 0}
                            playedAt={nowPlaying?.playedAt}
                            color={THEME.colors.primary}
                        />
                        <View style={styles.artworkWrapper}>
                            {nowPlaying?.albumArt ? (
                                <Image
                                    source={{ uri: nowPlaying.albumArt }}
                                    style={styles.artworkImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.artworkPlaceholder}>
                                    <Ionicons name="disc-outline" size={20} color={THEME.colors.textMuted} />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Center: Info */}
                    <View style={styles.info}>
                        <Text style={styles.nowPlayingLabel}>Now Playing:</Text>
                        <Animated.Text
                            key={nowPlaying?.track ? `track-${nowPlaying.track}` : 'track-empty'}
                            entering={FadeIn.duration(300)}
                            style={styles.track}
                            numberOfLines={1}
                        >
                            {nowPlaying?.track || (isConnecting ? 'Connecting...' : 'Waiting for Album...')}
                        </Animated.Text>

                        <View style={styles.subInfo}>
                            <Animated.Text
                                key={nowPlaying?.artist ? `artist-${nowPlaying.artist}` : 'artist-empty'}
                                entering={FadeIn.delay(100).duration(300)}
                                style={styles.artist}
                                numberOfLines={1}
                            >
                                {nowPlaying?.artist || (isConnecting ? 'Establishing...' : 'Not Playing')}
                            </Animated.Text>

                            {nowPlaying?.playedBy && (
                                <Animated.Text
                                    entering={FadeIn.delay(200)}
                                    style={styles.attribution}
                                    numberOfLines={1}
                                >
                                    • Added by {nowPlaying.playedBy}
                                </Animated.Text>
                            )}
                        </View>
                    </View>

                    {/* Right: Interaction */}
                    <View style={styles.interaction}>
                        {nowPlaying && (
                            <>
                                <TouchableOpacity
                                    onPress={handleLike}
                                    activeOpacity={0.7}
                                    style={styles.likeButton}
                                >
                                    <Animated.View style={heartStyle}>
                                        <Ionicons
                                            name={nowPlaying.userHasLiked ? "heart" : "heart-outline"}
                                            size={22}
                                            color={nowPlaying.userHasLiked ? THEME.colors.secondary : THEME.colors.textDim}
                                        />
                                    </Animated.View>
                                    {nowPlaying.likeCount !== undefined && nowPlaying.likeCount > 0 && (
                                        <Text style={[
                                            styles.likeCount,
                                            nowPlaying.userHasLiked && { color: THEME.colors.secondary }
                                        ]}>
                                            {nowPlaying.likeCount}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {isHost && (
                                    <TouchableOpacity
                                        onPress={handleStop}
                                        activeOpacity={0.7}
                                        style={styles.stopButton}
                                    >
                                        <Ionicons
                                            name="stop-circle-outline"
                                            size={24}
                                            color={THEME.colors.textDim}
                                        />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {!nowPlaying && (
                            <View style={styles.statusDotContainer}>
                                <View style={[
                                    styles.statusDot,
                                    isConnected ? styles.statusConnected : styles.statusDisconnected,
                                    isConnecting && styles.statusConnecting
                                ]} />
                            </View>
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
        paddingBottom: 4, // Leave space for home indicator on some LPs
    },
    container: {
        paddingVertical: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.md,
        gap: THEME.spacing.md,
    },
    artworkContainer: {
        position: 'relative',
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    artworkWrapper: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 17, // Circular
        overflow: 'hidden',
        backgroundColor: THEME.colors.surfaceLight,
    },
    artworkImage: {
        width: '100%',
        height: '100%',
    },
    artworkPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    subInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    nowPlayingLabel: {
        color: THEME.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    track: {
        color: THEME.colors.white,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    artist: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
    attribution: {
        color: THEME.colors.textMuted,
        fontSize: 11,
        fontStyle: 'italic',
    },
    interaction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.sm,
        minWidth: 40,
        justifyContent: 'flex-end',
    },
    likeButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: THEME.spacing.xs,
    },
    likeCount: {
        color: THEME.colors.textDim,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: -2,
    },
    statusDotContainer: {
        padding: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
    // Full variant styles
    fullContainer: {
        alignItems: 'center',
        paddingTop: THEME.spacing.md,
        paddingBottom: THEME.spacing.lg,
        width: '100%',
    },
    fullArtworkContainer: {
        width: 200,
        height: 200,
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
        backgroundColor: THEME.colors.surfaceLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    fullArtworkImage: {
        width: '100%',
        height: '100%',
    },
    fullArtworkPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullInfo: {
        alignItems: 'center',
        marginTop: THEME.spacing.md,
        paddingHorizontal: THEME.spacing.xl,
    },
    fullTrack: {
        color: THEME.colors.white,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: THEME.spacing.xs,
    },
    fullArtist: {
        color: THEME.colors.textDim,
        fontSize: 18,
        textAlign: 'center',
    },
    fullPlayButton: {
        marginTop: -40, // Overlap artwork slightly for tight look
        backgroundColor: THEME.colors.background,
        borderRadius: 40,
    },
    playButtonDisabled: {
        opacity: 0.4,
    },
    dropNeedleHint: {
        color: THEME.colors.textMuted,
        fontSize: 14,
        marginTop: THEME.spacing.md,
        textAlign: 'center',
    },
});
