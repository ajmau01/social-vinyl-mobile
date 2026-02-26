import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ProgressRing';
import { useSharedValue, withTiming } from 'react-native-reanimated';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
    const ActualReanimated = jest.requireActual('react-native-reanimated');
    return {
        ...ActualReanimated,
        withTiming: jest.fn((val, config) => val),
        useSharedValue: jest.fn((val) => ({ value: val })),
        useAnimatedProps: jest.fn((cb) => ({})),
        Easing: {
            linear: jest.fn(),
        },
    };
});

describe('ProgressRing', () => {
    const mockAnimatedValue = { value: 0 };
    const mockLastPlayedAt = { value: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        mockAnimatedValue.value = 0;
        mockLastPlayedAt.value = 0;
        // mockReturnValue (not Once) ensures re-renders always get the same stable reference,
        // simulating the real useSharedValue behaviour.
        (useSharedValue as jest.Mock).mockReturnValue(mockAnimatedValue);
    });

    it('projects progress by exactly 5 seconds when enough time remains', () => {
        render(
            <ProgressRing
                size={40}
                strokeWidth={4}
                position={10000} // 10s
                duration={60000} // 60s
            />
        );

        // Expected projection: (10000 + 5000) / 60000 = 0.25
        expect(withTiming).toHaveBeenCalledWith(0.25, expect.any(Object));
        expect(mockAnimatedValue.value).toBe(0.25);
    });

    it('prevents overshooting at the end of a track', () => {
        render(
            <ProgressRing
                size={40}
                strokeWidth={4}
                position={58000} // 58s (2s left)
                duration={60000} // 60s
                playedAt={12345}
            />
        );

        // Expected projection: (58000 + 2000) / 60000 = 1.0 (clamped by timeRemaining)
        expect(withTiming).toHaveBeenCalledWith(1.0, expect.any(Object));
        expect(mockAnimatedValue.value).toBe(1.0);
    });

    it('snaps to current position if drift is > 5%', () => {
        mockAnimatedValue.value = 0.1; // Currently at 10%

        render(
            <ProgressRing
                size={40}
                strokeWidth={4}
                position={12000} // 12s out of 60s = 20% (Delta = 10% > 5%)
                duration={60000}
            />
        );

        // Should snap to 20% immediately before starting 5s animation
        // Note: In implementation, animatedProgress.value is updated directly
        expect(mockAnimatedValue.value).toBe(0.2833333333333333); // position (12k) / duration (60k) = 0.2, then projection adds 5s (0.0833)
        // Wait, if it snaps, it sets the value to currentProgress, THEN calculates projection.
        // position/duration = 0.2. 
        // Then withTiming(projectedProgress) where projectedProgress = (12k + 5k)/60k = 17k/60k = 0.2833
        expect(withTiming).toHaveBeenCalledWith(0.2833333333333333, expect.any(Object));
    });
});
