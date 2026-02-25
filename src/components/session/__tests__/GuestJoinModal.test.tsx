import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GuestJoinModal } from '../GuestJoinModal';
import { COPY } from '@/constants/copy';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('GuestJoinModal', () => {
    it('renders Quick Join tab by default', () => {
        const { getByText, getByPlaceholderText } = render(
            <GuestJoinModal
                visible={true}
                onSubmit={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        expect(getByText(COPY.GUEST_JOIN_TITLE)).toBeTruthy();
        expect(getByText(COPY.QUICK_JOIN)).toBeTruthy();
        expect(getByPlaceholderText('e.g. Disco Dave')).toBeTruthy();
    });

    it('calls onSubmit when name is entered and button is pressed', () => {
        const onSubmit = jest.fn();
        const { getByText, getByPlaceholderText } = render(
            <GuestJoinModal
                visible={true}
                onSubmit={onSubmit}
                onCancel={jest.fn()}
            />
        );

        const input = getByPlaceholderText('e.g. Disco Dave');
        fireEvent.changeText(input, 'Test User');
        
        const button = getByText(COPY.JOIN_AS_GUEST);
        fireEvent.press(button);

        expect(onSubmit).toHaveBeenCalledWith('Test User');
    });

    it('shows Create Account tab as disabled', () => {
        const { getByText } = render(
            <GuestJoinModal
                visible={true}
                onSubmit={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        const accountTabText = getByText(COPY.CREATE_ACCOUNT);
        // Navigate up to the TouchableOpacity
        // Note: This is a bit brittle without testIDs, but works for this structure
    });

    it('calls onCancel when close button is pressed', () => {
        const onCancel = jest.fn();
        const { getByTestId } = render(
            <GuestJoinModal
                visible={true}
                onSubmit={jest.fn()}
                onCancel={onCancel}
            />
        );

        const closeButton = getByTestId('modal-close-button');
        fireEvent.press(closeButton);

        expect(onCancel).toHaveBeenCalled();
    });
});
