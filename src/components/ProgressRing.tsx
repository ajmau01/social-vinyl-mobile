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
    const animatedProgress = useSharedValue(0);
    const lastPlayedAt = useSharedValue(playedAt || 0);

    useEffect(() => {
        if (!duration) return;

        // If playedAt changed, it's a new album. Reset progress immediately.
        if (playedAt && playedAt !== lastPlayedAt.value) {
            animatedProgress.value = 0;
            lastPlayedAt.value = playedAt;
        }

        // Calculate current progress based on the position reported by server
        const currentProgress = Math.min(position / duration, 1);

        // Project where we SHOULD be in 5 seconds (next broadcast) to eliminate lag
        const projectedProgress = Math.min((position + 5000) / duration, 1);

        // Animate towards that projection over the 5s window
        animatedProgress.value = withTiming(projectedProgress, {
            duration: 5000,
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
