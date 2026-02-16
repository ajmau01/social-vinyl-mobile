import React from 'react';
import { render } from '@testing-library/react-native';
import { NowPlayingBanner } from '../NowPlayingBanner';
import { useWebSocket } from '@/hooks';

// Mock useWebSocket
jest.mock('@/hooks', () => ({
    useWebSocket: jest.fn()
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons'
}));

// Mock Haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Medium: 'medium'
    }
}));

// Mock ListeningBinSyncService
jest.mock('@/services/ListeningBinSyncService', () => ({
    listeningBinSyncService: {
        likeCurrentAlbum: jest.fn()
    }
}));

describe('NowPlayingBanner', () => {
    it('returns null when not connected and no track playing', () => {
        (useWebSocket as jest.Mock).mockReturnValue({
            nowPlaying: null,
            isConnected: false,
            isConnecting: false
        });

        const { toJSON } = render(<NowPlayingBanner />);
        expect(toJSON()).toBeNull();
    });

    it('renders connecting state', () => {
        (useWebSocket as jest.Mock).mockReturnValue({
            nowPlaying: null,
            isConnected: false,
            isConnecting: true
        });

        const { getByText } = render(<NowPlayingBanner />);
        expect(getByText('Connecting...')).toBeTruthy();
        expect(getByText('Establishing...')).toBeTruthy();
    });

    it('renders track info and attribution when playing', () => {
        (useWebSocket as jest.Mock).mockReturnValue({
            nowPlaying: {
                track: 'Blue Train',
                artist: 'John Coltrane',
                albumArt: 'http://example.com/art.jpg',
                playedBy: 'Andrew'
            },
            isConnected: true,
            isConnecting: false
        });

        const { getByText } = render(<NowPlayingBanner />);
        expect(getByText('Blue Train')).toBeTruthy();
        expect(getByText('John Coltrane')).toBeTruthy();
        expect(getByText(/Added by Andrew/)).toBeTruthy();
    });
});
