// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '@/utils/logger';

// Mock logger
jest.mock('@/utils/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test Error');
    }
    return null;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Silence console.error for expected errors during testing
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    it('renders children when there is no error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <Text>Normal Content</Text>
            </ErrorBoundary>
        );

        expect(getByText('Normal Content')).toBeTruthy();
    });

    it('renders fallback UI when an error occurs', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(getByText('Something went wrong')).toBeTruthy();
        expect(getByText('The application encountered an unexpected error and needs to restart.')).toBeTruthy();
        expect(logger.error).toHaveBeenCalled();
    });

    it('renders custom fallback if provided', () => {
        const { getByText } = render(
            <ErrorBoundary fallback={<Text>Custom Fallback</Text>}>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(getByText('Custom Fallback')).toBeTruthy();
    });

    it('resets error state when Reload button is pressed', () => {
        const { getByText, rerender } = render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(getByText('Something went wrong')).toBeTruthy();

        // First, rerender with a non-throwing child
        rerender(
            <ErrorBoundary>
                <Text>Recovered Content</Text>
            </ErrorBoundary>
        );

        // Even after rerender, it should still show the error UI 
        // because the state hasn't been reset yet.
        expect(getByText('Something went wrong')).toBeTruthy();

        const reloadButton = getByText('Reload Application');
        fireEvent.press(reloadButton);

        // After reset, it should render the new children
        expect(getByText('Recovered Content')).toBeTruthy();
    });
});
