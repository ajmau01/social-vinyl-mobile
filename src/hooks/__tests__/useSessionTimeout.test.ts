// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { renderHook, act } from '@testing-library/react-native';
import { useSessionTimeout } from '../useSessionTimeout';
import { useSessionStore } from '@/store/useSessionStore';
import { useRouter } from 'expo-router';
import { logger } from '@/utils/logger';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        log: jest.fn(),
    },
}));

jest.mock('@/store/useSessionStore', () => ({
    useSessionStore: jest.fn(),
}));

describe('useSessionTimeout', () => {
    const mockReplace = jest.fn();
    const mockClearSession = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });

        (useSessionStore as any).mockReturnValue({
            lastInteractionTime: Date.now(),
            clearSession: mockClearSession,
            username: 'test-user',
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('does nothing if user is not logged in', () => {
        (useSessionStore as any).mockReturnValue({
            username: null,
            lastInteractionTime: Date.now(),
            clearSession: mockClearSession,
        });

        renderHook(() => useSessionTimeout());

        act(() => {
            jest.advanceTimersByTime(31 * 60 * 1000);
        });

        expect(mockClearSession).not.toHaveBeenCalled();
    });

    it('logs out user after 30 minutes of inactivity', async () => {
        const startTime = Date.now();
        (useSessionStore as any).mockReturnValue({
            lastInteractionTime: startTime,
            clearSession: mockClearSession.mockResolvedValue(undefined),
            username: 'test-user',
        });

        renderHook(() => useSessionTimeout());

        act(() => {
            const futureTime = startTime + 31 * 60 * 1000;
            jest.setSystemTime(futureTime);
            jest.advanceTimersByTime(31 * 60 * 1000);
        });

        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('timed out'));
        expect(mockClearSession).toHaveBeenCalled();
    });
});
