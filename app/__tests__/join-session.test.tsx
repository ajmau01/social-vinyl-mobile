// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import JoinSessionScreen from '../join-session';
import { useSessionStore } from '@/store/useSessionStore';
import { useServices } from '@/contexts/ServiceContext';
import { secureStorage } from '@/utils/storage';

// Mocks
jest.mock('@/store/useSessionStore');
jest.mock('@/contexts/ServiceContext');
jest.mock('@/utils/storage');
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({ code: undefined }),
    Stack: {
        Screen: () => null
    }
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@/components/session/QRScanner', () => ({
    QRScanner: () => null
}));

describe('JoinSessionScreen', () => {
    const mockSessionService = {
        joinSession: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useServices as jest.Mock).mockReturnValue({
            sessionService: mockSessionService,
        });
        (secureStorage.getAuthToken as jest.Mock).mockResolvedValue(null);
    });

    it('bypasses modal and auto-joins for returning users with valid token and name', async () => {
        (useSessionStore as unknown as jest.Mock).mockReturnValue({
            displayName: 'Returning User',
            username: 'returning_user',
            joinCode: 'ABCDE',
            setJoinCode: jest.fn(),
        });
        (secureStorage.getAuthToken as jest.Mock).mockResolvedValue('valid-token');
        mockSessionService.joinSession.mockResolvedValue({ success: true });

        render(<JoinSessionScreen />);

        await waitFor(() => {
            expect(mockSessionService.joinSession).toHaveBeenCalledWith('ABCDE', 'returning_user');
            expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/bin');
        });
    });

    it('opens GuestJoinModal when no authToken is found', async () => {
        (useSessionStore as unknown as jest.Mock).mockReturnValue({
            displayName: null,
            username: null,
            joinCode: 'ABCDE',
            setJoinCode: jest.fn(),
        });
        (secureStorage.getAuthToken as jest.Mock).mockResolvedValue(null);

        const { getByText } = render(<JoinSessionScreen />);

        await waitFor(() => {
            expect(getByText('Welcome to the Party!')).toBeTruthy();
        });
    });
});
