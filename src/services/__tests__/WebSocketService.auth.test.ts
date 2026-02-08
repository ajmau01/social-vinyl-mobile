// Mock WebSocket class
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

    constructor(public url: string) {
        MockWebSocket.instances.push(this);
    }
}
global.WebSocket = MockWebSocket as any;

describe('WebSocketService Authentication', () => {
    let wsService: any;
    let CONFIG: any;
    let logger: any;
    let callbacks: any;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        jest.useFakeTimers(); // Consistency
        MockWebSocket.instances = [];

        // Mock config before requiring service
        jest.doMock('@/config', () => ({
            CONFIG: {
                WS_URL: 'ws://test-url',
                DEBUG_WS: true,
                USE_MESSAGE_AUTH: true
            }
        }));

        // Mock logger
        jest.doMock('@/utils/logger', () => ({
            logger: {
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
            }
        }));

        wsService = require('../WebSocketService').wsService;
        CONFIG = require('@/config').CONFIG;
        logger = require('@/utils/logger').logger;

        callbacks = {
            onConnectionStateChange: jest.fn(),
            onMessage: jest.fn(),
            onError: jest.fn(),
            onSessionJoined: jest.fn(),
        };
        wsService.setCallbacks(callbacks);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('sends authenticate message on connect when USE_MESSAGE_AUTH is true', () => {
        wsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
            action: 'authenticate',
            authToken: 'test-token',
            username: 'test-user'
        }));
    });

    it('disconnects if authentication times out', () => {
        wsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        // Advance time by 11 seconds
        jest.advanceTimersByTime(11000);

        expect(mockSocket.close).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Authentication timed out'));
        expect(callbacks.onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('clears timeout and stays connected on AUTH_SUCCESS', () => {
        const spy = jest.spyOn(global, 'clearTimeout');
        wsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        mockSocket.onmessage?.({
            data: JSON.stringify({ type: 'AUTH_SUCCESS' })
        });

        expect(spy).toHaveBeenCalled();
        expect(mockSocket.close).not.toHaveBeenCalled();
        expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
    });

    it('clears auth timeout on WELCOME message', () => {
        const spy = jest.spyOn(global, 'clearTimeout');
        wsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        mockSocket.onmessage?.({
            data: JSON.stringify({ type: 'WELCOME', sessionId: 'test-session' })
        });

        expect(spy).toHaveBeenCalled();
        expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
    });

    it('handles AUTH_ERROR and disconnects', () => {
        wsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        mockSocket.onmessage?.({
            data: JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid token' })
        });

        expect(mockSocket.close).toHaveBeenCalled();
        expect(callbacks.onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('includes authToken in URL when USE_MESSAGE_AUTH is false', () => {
        // We need to re-require with different mock
        jest.resetModules();
        jest.doMock('@/config', () => ({
            CONFIG: {
                WS_URL: 'ws://test-url',
                USE_MESSAGE_AUTH: false
            }
        }));
        const newWsService = require('../WebSocketService').wsService;

        newWsService.connect('test-user', 'test-token');
        const mockSocket = MockWebSocket.instances[0];

        expect(mockSocket.url).toContain('authToken=test-token');
    });
});
