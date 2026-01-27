import { wsService } from '../WebSocketService';
import { useSessionStore } from '../../store/useSessionStore';
import { CONFIG } from '@/config';

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
    beforeEach(() => {
        jest.clearAllMocks();
        MockWebSocket.instances = [];
        useSessionStore.setState({ isConnected: false, isConnecting: false });
        // @ts-ignore
        wsService.disconnect(); // Reset state
        // @ts-ignore
        wsService.shouldReconnect = true; // Reset reconnect flag
    });

    it('should connect to the configured URL', () => {
        wsService.connect();
        expect(MockWebSocket.instances.length).toBe(1);
        expect(useSessionStore.getState().isConnecting).toBe(true);
    });

    it('should update store on successful connection', () => {
        wsService.connect();
        const mockSocket = MockWebSocket.instances[0];

        // Simulate Open Event
        mockSocket.onopen?.();

        expect(useSessionStore.getState().isConnected).toBe(true);
        expect(useSessionStore.getState().isConnecting).toBe(false);
    });

    it('should handle incoming JSON messages', () => {
        wsService.connect();
        const mockSocket = MockWebSocket.instances[0];

        const rawPayload = {
            type: 'NOW_PLAYING',
            album: {
                title: 'Test Track',
                artist: 'Test Artist',
                releaseId: 12345,
                coverImage: 'http://example.com/cover.jpg'
            }
        };
        const event = { data: JSON.stringify(rawPayload) };

        // Simulate Message
        mockSocket.onmessage?.(event);

        expect(useSessionStore.getState().nowPlaying).toEqual({
            title: 'Test Track',
            artist: 'Test Artist',
            releaseId: '12345',
            coverInfo: { pixelUri: 'http://example.com/cover.jpg' }
        });
    });
});
