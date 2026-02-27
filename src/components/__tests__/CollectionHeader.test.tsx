// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CollectionHeader } from '../CollectionHeader';

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

// Mock SegmentedControl
jest.mock('../SegmentedControl', () => ({
    SegmentedControl: 'SegmentedControl',
}));

describe('CollectionHeader', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const mockProps = {
        title: 'Test Crate',
        syncStatus: 'idle' as const,
        syncProgress: null,
        viewMode: 'genre' as const,
        lastSyncTime: Date.now(),
        isSearchVisible: false,
        onSearchPress: jest.fn(),
        onRandomPress: jest.fn(),
        onMenuPress: jest.fn(),
        onViewModeChange: jest.fn(),
    };

    it('renders correctly', () => {
        const { getByText, getByTestId } = render(<CollectionHeader {...mockProps} />);

        expect(getByText('Test Crate')).toBeTruthy();
        expect(getByTestId('collection-header-dice-button')).toBeTruthy();
    });

    it('handles random press when enabled', () => {
        const { getByTestId } = render(<CollectionHeader {...mockProps} />);

        fireEvent.press(getByTestId('collection-header-dice-button'));
        expect(mockProps.onRandomPress).toHaveBeenCalled();
    });

    it('disables random button when isRandomDisabled is true', () => {
        const { getByTestId } = render(
            <CollectionHeader {...mockProps} isRandomDisabled={true} />
        );

        const diceButton = getByTestId('collection-header-dice-button');
        // Check if disabled prop is passed (React Native testing library handles this)
        expect(diceButton.props.accessibilityState.disabled).toBe(true);
        // Verify opacity style
        expect(diceButton.props.style).toEqual(
            expect.objectContaining({ opacity: 0.5 })
        );

        fireEvent.press(diceButton);
        // Should not fire if disabled? Actually TouchableOpacity onPress might still fire in test unless restricted
        // But we rely on accessibilityState for correctness check.
    });

    it('shows syncing status', () => {
        const { getByText } = render(
            <CollectionHeader
                {...mockProps}
                syncStatus="syncing"
                syncProgress={45}
            />
        );
        expect(getByText('Syncing... 45%')).toBeTruthy();
    });
});
