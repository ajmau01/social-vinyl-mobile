// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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
        wsService.connect('test-user', 'test-token', 'test-session', 'test-secret');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
            action: 'authenticate',
            authToken: 'test-token',
            sessionId: 'test-session',
            sessionSecret: 'test-secret',
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
        wsService.connect('test-user', 'test-token', 'test-session', 'test-secret');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        mockSocket.onmessage?.({
            data: JSON.stringify({ type: 'WELCOME', sessionId: 'test-session' })
        });

        expect(spy).toHaveBeenCalled();
        expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
    });

    it('clears auth timeout on access-level message (PR #99 feedback)', () => {
        const spy = jest.spyOn(global, 'clearTimeout');
        wsService.connect('test-user', 'test-token', 'test-session', 'test-secret');
        const mockSocket = MockWebSocket.instances[0];

        mockSocket.onopen?.();

        mockSocket.onmessage?.({
            data: JSON.stringify({ type: 'ACCESS_LEVEL', message: 'host' })
        });

        expect(spy).toHaveBeenCalled();
        expect(mockSocket.close).not.toHaveBeenCalled();
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

    it('does NOT include authToken in URL even if WE_MESSAGE_AUTH is false (Security Hardening)', () => {
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

        expect(mockSocket.url).not.toContain('authToken=test-token');
        expect(mockSocket.url).toContain('username=test-user');
    });
});

describe('WebSocketService register() two-phase flow', () => {
    let wsService: any;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        jest.useFakeTimers();
        MockWebSocket.instances = [];

        jest.doMock('@/config', () => ({
            CONFIG: { WS_URL: 'ws://test-url', DEBUG_WS: false, USE_MESSAGE_AUTH: true }
        }));
        jest.doMock('@/utils/logger', () => ({
            logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() }
        }));

        wsService = require('../WebSocketService').wsService;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('resolves with full payload after access-level then session-joined', async () => {
        const registerPromise = wsService.register('newuser', 'password123');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        // Step 1: access-level arrives with token
        tempSocket.onmessage?.({ data: JSON.stringify({
            type: 'access-level', level: 'ADMIN', authToken: 'tok-abc'
        })});

        // Step 2: session-joined arrives with full payload
        tempSocket.onmessage?.({ data: JSON.stringify({
            type: 'session-joined',
            sessionId: 42,
            sessionSecret: 'sec-xyz',
            name: 'My Session',
            joinCode: 'JOIN1',
            hostUsername: 'newuser',
            isPermanent: false
        })});

        const result = await registerPromise;

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe('tok-abc');
        expect(result.data?.sessionId).toBe('42');
        expect(result.data?.joinCode).toBe('JOIN1');
        expect(result.data?.hostUsername).toBe('newuser');
        expect(tempSocket.close).toHaveBeenCalled();
    });

    it('resolves correctly when session-joined carries its own authToken', async () => {
        const registerPromise = wsService.register('newuser', 'password123');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        // session-joined arrives first with its own token (no prior access-level)
        tempSocket.onmessage?.({ data: JSON.stringify({
            type: 'session-joined',
            authToken: 'direct-token',
            sessionId: 99,
            sessionSecret: 'sec-direct',
            name: 'Direct Session',
            joinCode: 'DIRCT',
            hostUsername: 'newuser',
            isPermanent: true
        })});

        const result = await registerPromise;

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe('direct-token');
        expect(result.data?.sessionId).toBe('99');
    });

    it('fails fast when session-joined arrives with no token at all', async () => {
        const registerPromise = wsService.register('newuser', 'password123');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        // No access-level sent first; session-joined has no token either
        tempSocket.onmessage?.({ data: JSON.stringify({
            type: 'session-joined',
            sessionId: 1,
            joinCode: 'NOTOK'
            // authToken intentionally absent
        })});

        const result = await registerPromise;

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('no auth token');
        expect(tempSocket.close).toHaveBeenCalled();
    });

    it('resolves with error on server error message', async () => {
        const registerPromise = wsService.register('takenuser', 'pass');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        tempSocket.onmessage?.({ data: JSON.stringify({
            type: 'error', message: 'Username already taken'
        })});

        const result = await registerPromise;

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe('Username already taken');
        expect(tempSocket.close).toHaveBeenCalled();
    });

    it('times out after 10 seconds if no response', async () => {
        const registerPromise = wsService.register('newuser', 'pass');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        jest.advanceTimersByTime(10001);

        const result = await registerPromise;

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('timed out');
        expect(tempSocket.close).toHaveBeenCalled();
    });

    it('resolves with error on WebSocket network error', async () => {
        const registerPromise = wsService.register('newuser', 'pass');
        const tempSocket = MockWebSocket.instances[0];

        tempSocket.readyState = MockWebSocket.OPEN;
        tempSocket.onopen?.();

        tempSocket.onerror?.({ type: 'error' });

        const result = await registerPromise;

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Network error');
        expect(tempSocket.close).toHaveBeenCalled();
    });
});
