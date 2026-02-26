import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
    size: number;
    strokeWidth: number;
    position: number; // in ms
    duration: number; // in ms
    playedAt?: number; // timestamp in ms
    color?: string;
    backgroundColor?: string;
}

/**
 * A circular progress indicator meant for the Now Playing banner.
 * Uses react-native-reanimated to smooth out the 5s interval updates
 * from the backend.
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
    // flash back to 0 while waiting for the first server position broadcast.
    const getInitialProgress = () => {
        if (!duration) return 0;
        if (playedAt) return Math.min(Math.max((Date.now() - playedAt) / duration, 0), 1);
        return Math.min(position / duration, 1);
    };

    const animatedProgress = useSharedValue(getInitialProgress());
    const lastPlayedAt = useSharedValue(playedAt || 0);

    const BROADCAST_INTERVAL_MS = 5000;

    useEffect(() => {
        if (!duration) return;

        const currentProgress = Math.min(position / duration, 1);
        const delta = Math.abs(currentProgress - (animatedProgress.value || 0));

        // Issue #4: Progress Ring Reconnection Snap
        // If off by more than 5%, instant reset (no animation) to avoid catching up lag
        if (delta > 0.05) {
            animatedProgress.value = currentProgress;
            lastPlayedAt.value = playedAt || 0;
        } else if (playedAt && playedAt !== lastPlayedAt.value) {
            // New album detected
            animatedProgress.value = 0;
            lastPlayedAt.value = playedAt;
        }

        // Use playedAt-derived position for projection when available — it is more
        // accurate than the server-reported position (which can lag by up to 5s).
        // Without this, getInitialProgress() sets the ring ahead of `position`, and
        // the first withTiming call projects to a target already reached, causing a
        // visible stall of one broadcast interval.
        const truePositionMs = playedAt
            ? Math.min(Date.now() - playedAt, duration)
            : position;

        // Issue #3: Progress Ring Track End Overshoot prevention
        const timeRemaining = duration - truePositionMs;
        const projectionWindow = Math.min(timeRemaining, BROADCAST_INTERVAL_MS);

        // Project where we SHOULD be in the next window to eliminate lag
        const projectedProgress = Math.min((truePositionMs + projectionWindow) / duration, 1);

        // Animate towards that projection over the interval window
        animatedProgress.value = withTiming(projectedProgress, {
            duration: BROADCAST_INTERVAL_MS,
            easing: Easing.linear,
        });
    }, [position, duration, playedAt]);

    const animatedProps = useAnimatedProps(() => {
        // Clamp progress between 0 and 1 to prevent SVG dash bugs
        const clampedProgress = Math.min(Math.max(animatedProgress.value, 0), 1);
        const strokeDashoffset = circumference * (1 - clampedProgress);

        return {
            strokeDashoffset,
        };
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
