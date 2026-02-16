import { wsService } from '../WebSocketService';
import { useSessionStore } from '../../store/useSessionStore';
import { CONFIG } from '@/config';
import { ConnectionState } from '@/types';

// Mock AsyncStorage for Zustand persist
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

// Mock WebSocket
class MockWebSocket {
    static instances: MockWebSocket[] = [];
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = 0;
    send = jest.fn();
    close = jest.fn();
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor(url: string) {
        MockWebSocket.instances.push(this);
    }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

describe('WebSocketService', () => {
    let callbacks: any;

    beforeEach(() => {
        jest.clearAllMocks();
        MockWebSocket.instances = [];
        useSessionStore.setState({
            connectionState: 'disconnected',
            nowPlaying: null,
            authToken: null,
            sessionId: null
        });

        callbacks = {
            onConnectionStateChange: jest.fn((state: ConnectionState) => {
                const store = useSessionStore.getState();
                store.setConnectionState(state);
            }),
            onMessage: jest.fn((rawData) => {
                const store = useSessionStore.getState();
                if (rawData.type === 'NOW_PLAYING' && rawData.album) {
                    store.setNowPlaying({
                        track: rawData.album.title,
                        artist: rawData.album.artist,
                        album: rawData.album.title,
                        albumArt: rawData.album.coverImage,
                        releaseId: String(rawData.album.releaseId),
                        timestamp: expect.any(Number),
                        duration: rawData.duration,
                        position: rawData.position,
                        userHasLiked: rawData.userHasLiked,
                        playedBy: rawData.playedBy,
                        likeCount: rawData.thumbCount
                    });
                }
            }),
            onError: jest.fn(),
            onSessionJoined: jest.fn((data) => {
                const store = useSessionStore.getState();
                if (data.authToken) store.setAuthToken(data.authToken);
                if (data.sessionId) store.setSessionId(data.sessionId);
            }),
            onNowPlaying: jest.fn((data) => {
                const store = useSessionStore.getState();
                store.setNowPlaying(data);
            }),
            onSessionEnded: jest.fn(() => {
                const store = useSessionStore.getState();
                store.setSessionId(null);
                store.setNowPlaying(null);
            })
        };

        wsService.setCallbacks(callbacks);
        wsService.disconnect();
    });

    it('should connect to the configured URL', () => {
        wsService.connect('testuser');
        expect(MockWebSocket.instances.length).toBe(1);
        expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connecting');
        expect(useSessionStore.getState().connectionState).toBe('connecting');
    });

    it('should update store on successful connection', () => {
        wsService.connect('testuser');
        const mockSocket = MockWebSocket.instances[0];

        // Simulate Open Event
        mockSocket.onopen?.();

        expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
        expect(useSessionStore.getState().connectionState).toBe('connected');
    });

    it('should handle incoming JSON messages', () => {
        wsService.connect('testuser');
        const mockSocket = MockWebSocket.instances[0];

        const rawPayload = {
            type: 'NOW_PLAYING',
            album: {
                title: 'Test Track',
                artist: 'Test Artist',
                releaseId: '12345',
                coverImage: 'http://example.com/cover.jpg'
            }
        };
        const event = { data: JSON.stringify(rawPayload) };

        // Simulate Message
        mockSocket.onmessage?.(event);

        expect(callbacks.onMessage).toHaveBeenCalledWith(rawPayload);
        expect(callbacks.onNowPlaying).toHaveBeenCalledWith(expect.objectContaining({
            track: 'Test Track',
            artist: 'Test Artist'
        }));
        expect(useSessionStore.getState().nowPlaying).toEqual(expect.objectContaining({
            track: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Track',
            albumArt: 'http://example.com/cover.jpg',
            releaseId: '12345'
        }));
    });

    it('should return error Result on login failure', async () => {
        const loginPromise = wsService.login('testuser', 'wrongpass');
        const mockSocket = MockWebSocket.instances[0];

        // Simulate Error from server
        mockSocket.onmessage?.({
            data: JSON.stringify({
                type: 'error',
                message: 'Invalid credentials'
            })
        });

        const result = await loginPromise;
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.message).toContain('Invalid credentials');
        }
    });
});
