import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSessionStore } from '@/store/useSessionStore';
import { THEME } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NowPlayingBanner = () => {
    const { nowPlaying, isConnected, isConnecting } = useSessionStore();
    const insets = useSafeAreaInsets();

    // Design Decision: We show "Connecting..." even if track is null to give feedback.
    if (!nowPlaying && !isConnecting && !isConnected) return null;

    // Dynamic bottom position to sit above the tab bar (which includes safe area)
    const bottomPadding = Math.max(insets.bottom, 10);
    const tabBarHeight = THEME.layout.tabBarHeight + bottomPadding;

    return (
        <View style={[styles.wrapper, { bottom: tabBarHeight }]}>
            <BlurView intensity={80} tint="dark" style={[styles.container, { paddingBottom: THEME.spacing.sm }]}>
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
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        // bottom set dynamically
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
        backgroundColor: THEME.colors.status.success,
        shadowColor: THEME.colors.status.success,
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    statusConnecting: {
        backgroundColor: THEME.colors.status.warning,
    },
    statusDisconnected: {
        backgroundColor: THEME.colors.textMuted,
    },
});
