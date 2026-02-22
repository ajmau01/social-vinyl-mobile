import React from 'react';
import { render } from '@testing-library/react-native';
import { ActiveSessionView } from '../ActiveSessionView';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';

// Comprehensive mocks
jest.mock('@/store/useSessionStore');
jest.mock('@/store/useListeningBinStore');
jest.mock('@/services/ListeningBinSyncService', () => ({
    listeningBinSyncService: {
        endSession: jest.fn(),
        playAlbum: jest.fn(),
        removeAlbum: jest.fn(),
    },
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('react-native-reanimated', () => {
    const View = require('react-native').View;
    return {
        __esModule: true,
        default: {
            View: View,
            createAnimatedComponent: (comp: any) => comp,
        },
        View: View,
        FadeIn: {
            duration: () => ({
                delay: () => ({}),
            }),
        },
        Animated: {
            View: View,
        },
    };
});

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }: any) => children,
}));

jest.mock('expo-blur', () => ({
    BlurView: ({ children }: any) => children,
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('react-native-gesture-handler', () => {
    const View = require('react-native').View;
    return { GestureHandlerRootView: View, State: {}, Directions: {} };
});

jest.mock('react-native-draggable-flatlist', () => {
    const View = require('react-native').View;
    return ({ data, renderItem }: any) => (
        <View>
            {(data || []).map((item: any, index: number) => renderItem({ item, index, drag: jest.fn(), isActive: false }))}
        </View>
    );
});

describe('ActiveSessionView', () => {
    it('renders basic active session indicators', () => {
        (useSessionStore as unknown as jest.Mock).mockReturnValue({
            sessionId: 'test-session',
            sessionName: 'Test Party',
            sessionRole: 'host',
            sessionMode: 'party',
            sessionStartTime: Date.now(),
            hostUsername: 'hostUser',
            username: 'hostUser',
            joinCode: 'ABCDE',
            isBroadcast: true,
        });

        (useListeningBinStore as unknown as jest.Mock).mockReturnValue({
            items: [],
            setBin: jest.fn(),
        });

        const { getByText, getByTestId } = render(<ActiveSessionView />);

        expect(getByText('PARTY')).toBeTruthy();
        expect(getByText('On Air')).toBeTruthy();
        expect(getByTestId('up-next-title')).toBeTruthy();
    });

    it('displays correctly when bin is empty', () => {
        (useSessionStore as unknown as jest.Mock).mockReturnValue({
            sessionId: 'test-session',
            sessionRole: 'host',
            sessionMode: 'party',
        });
        (useListeningBinStore as unknown as jest.Mock).mockReturnValue({
            items: [],
        });

        const { getByText } = render(<ActiveSessionView />);
        expect(getByText(/Waiting for guests/i)).toBeTruthy();
    });
});
