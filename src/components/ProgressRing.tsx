import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
    size: number;
    strokeWidth: number;
    position: number; // in ms (fallback when playedAt unavailable)
    duration: number; // in ms
    playedAt?: number; // unix ms timestamp when playback started
    color?: string;
    backgroundColor?: string;
}

/**
 * A circular progress indicator for the Now Playing banner.
 *
 * Primary path: uses a 1-second setInterval with Date.now() - playedAt, mirroring
 * the webapp implementation. This is immune to server-broadcast lag and produces
 * smooth, accurate progress regardless of how frequently the server sends updates.
 *
 * Fallback path: when playedAt is unavailable, advances to the server-reported
 * position on each prop update.
 *
 * Both paths use withTiming(1100ms) for a CSS-transition-like smooth advance,
 * just as the webapp uses `transition: stroke-dashoffset 1s linear`.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
    size,
    strokeWidth,
    position,
    duration,
    playedAt,
    color = COLORS.primary,
    backgroundColor = 'rgba(255, 255, 255, 0.1)'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Initialize from playedAt so remounts (e.g. host switching tabs) don't
    // flash back to 0 while waiting for the first interval tick.
    const getInitialProgress = () => {
        if (!duration) return 0;
        if (playedAt) return Math.min(Math.max((Date.now() - playedAt) / duration, 0), 1);
        return Math.min(position / duration, 1);
    };

    const animatedProgress = useSharedValue(getInitialProgress());

    // Primary: clock-based setInterval — mirrors webapp's startProgressTimer.
    // Recalculates from playedAt every second so the ring advances continuously
    // between server broadcasts without any lag or projection math.
    useEffect(() => {
        if (!duration || !playedAt) return;

        const tick = () => {
            const progress = Math.min(Math.max((Date.now() - playedAt) / duration, 0), 1);
            animatedProgress.value = withTiming(progress, {
                duration: 1100, // slightly over 1s — mirrors CSS `transition: 1s linear`
                easing: Easing.linear,
            });
        };

        tick(); // Immediately jump to the correct position
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [playedAt, duration]);

    // Fallback: no playedAt — animate to server-reported position on each update.
    useEffect(() => {
        if (!duration || playedAt) return;
        const progress = Math.min(Math.max(position / duration, 0), 1);
        animatedProgress.value = withTiming(progress, {
            duration: 1000,
            easing: Easing.linear,
        });
    }, [position, duration, playedAt]);

    const animatedProps = useAnimatedProps(() => {
        const clampedProgress = Math.min(Math.max(animatedProgress.value, 0), 1);
        const strokeDashoffset = circumference * (1 - clampedProgress);
        return { strokeDashoffset };
    });

    return (
        <Svg width={size} height={size}>
            {/* Background Circle */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={backgroundColor}
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Animated Progress Circle */}
            <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
    );
};
