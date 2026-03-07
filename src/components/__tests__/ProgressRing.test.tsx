// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ProgressRing';
import { useSharedValue, withTiming } from 'react-native-reanimated';

// Mock react-native-svg (native module unavailable in Jest environment)
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    const Svg = ({ children }: any) => React.createElement(View, {}, children);
    const Circle = (_props: any) => React.createElement(View, {});
    return { __esModule: true, default: Svg, Circle };
});

// Mock reanimated — complete standalone mock (avoids jest.requireActual conflicts with
// the global require('react-native-reanimated/mock') in jest.setup.js).
jest.mock('react-native-reanimated', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: {
            createAnimatedComponent: (comp: any) => comp,
            View: ({ children, style }: any) => React.createElement(View, { style }, children),
        },
        withTiming: jest.fn((val: any, _config?: any) => val),
        withRepeat: jest.fn((val: any) => val),
        cancelAnimation: jest.fn(),
        useSharedValue: jest.fn((val: any) => ({ value: val })),
        useAnimatedProps: jest.fn((_cb: any) => ({})),
        useAnimatedStyle: jest.fn((_cb: any) => ({})),
        Easing: {
            linear: jest.fn((x: any) => x),
            bezier: jest.fn(),
            inOut: jest.fn((fn: any) => fn),
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
