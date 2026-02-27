// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ProgressRing';
import { useSharedValue, withTiming } from 'react-native-reanimated';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
    const ActualReanimated = jest.requireActual('react-native-reanimated');
    return {
        ...ActualReanimated,
        withTiming: jest.fn((val, _config) => val),
        useSharedValue: jest.fn((val) => ({ value: val })),
        useAnimatedProps: jest.fn((_cb) => ({})),
        Easing: {
            linear: jest.fn(),
        },
    };
});

const NOW = 1_700_000_000_000; // Fixed "now" for deterministic tests

describe('ProgressRing', () => {
    const mockAnimatedValue = { value: 0 };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
        jest.clearAllMocks();
        mockAnimatedValue.value = 0;
        // Always return the same stable reference — simulates real useSharedValue behaviour
        (useSharedValue as jest.Mock).mockReturnValue(mockAnimatedValue);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('uses clock-based progress when playedAt is available', () => {
        // playedAt = NOW - 60_000ms (60s ago), duration = 146_000ms (2:26)
        // expected progress = 60_000 / 146_000 ≈ 0.411
        const playedAt = NOW - 60_000;
        render(
            <ProgressRing size={40} strokeWidth={4} position={0} duration={146_000} playedAt={playedAt} />
        );

        expect(withTiming).toHaveBeenCalledWith(
            expect.closeTo(60_000 / 146_000, 3),
            expect.any(Object)
        );
    });

    it('advances every second via setInterval', () => {
        const playedAt = NOW - 60_000;
        render(
            <ProgressRing size={40} strokeWidth={4} position={0} duration={146_000} playedAt={playedAt} />
        );

        const callsBefore = (withTiming as jest.Mock).mock.calls.length;

        // Advance fake clock by 3 seconds — should trigger 3 more setInterval ticks
        jest.advanceTimersByTime(3000);

        expect((withTiming as jest.Mock).mock.calls.length).toBe(callsBefore + 3);
    });

    it('clamps progress to 1.0 at end of track', () => {
        // playedAt = NOW - 150_000ms (past a 146s track)
        const playedAt = NOW - 150_000;
        render(
            <ProgressRing size={40} strokeWidth={4} position={0} duration={146_000} playedAt={playedAt} />
        );

        expect(withTiming).toHaveBeenCalledWith(1.0, expect.any(Object));
    });

    it('falls back to position-based progress when playedAt is unavailable', () => {
        // position = 73_000ms, duration = 146_000ms → 50%
        render(
            <ProgressRing size={40} strokeWidth={4} position={73_000} duration={146_000} />
        );

        expect(withTiming).toHaveBeenCalledWith(
            expect.closeTo(0.5, 3),
            expect.any(Object)
        );
    });
});
