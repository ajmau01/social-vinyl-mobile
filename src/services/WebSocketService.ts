import { CONFIG } from '@/config';
import {
    NowPlaying,
    WebSocketMessage,
    WebSocketCallbacks,
    AsyncResult,
    LoginResult
} from '@/types';
import { IWebSocketService } from './interfaces';
import { logger } from '@/utils/logger';
import { ActionAckSchema, AuthResponseSchema, ProtocolAckSchema, WebSocketMessageSchema } from '@/types/schemas';
import { generateUUID } from '@/utils/uuid';
import { networkSecurity } from '@/utils/network';

// Issue #125: Protocol Versioning
const PROTOCOL_VERSION = '1.0';

class WebSocketService implements IWebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: any = null;
    private shouldReconnect = true;
    private callbacks: WebSocketCallbacks | null = null;
    private currentConfig: {
        username: string;
        authToken?: string;
        sessionId?: string;
        sessionSecret?: string;
    } | null = null;
    private authTimeout: any = null;
    private extraOnNowPlaying: ((data: any) => void) | undefined;

    // Issue #125: Pending Actions Map
    private pendingActions = new Map<string, {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
        timeout: any;
    }>();

    // Issue #126: Dedicated listeners for Bin State to avoid conflicts with useWebSocket
    private binStateListeners: ((items: any[]) => void)[] = [];

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }


    public connect(username: string, authToken?: string, sessionId?: string, sessionSecret?: string) {
        if (this.socket?.readyState === WebSocket.OPEN) return;
        if (CONFIG.DEBUG_WS) logger.log('[WS] Connecting...');

        this.currentConfig = { username, authToken, sessionId, sessionSecret };
        this.shouldReconnect = true;

        if (!username) {
            if (CONFIG.DEBUG_WS) logger.log('[WS] Skip connect: No username');
            this.callbacks?.onConnectionStateChange('disconnected');
            return;
        }

        // Issue #68: Credentials are now sent via message-based auth
        // We only send username/watchedUsername in the URL

        const wsUrlWithParams = `${CONFIG.WS_URL}?username=${username}&watchedUsername=${username}`;
        if (CONFIG.DEBUG_WS) logger.log('[WS] Connecting to:', wsUrlWithParams);

        // TODO: In production, wrap this with SSL Pinning if networkSecurity.isSslPinningEnabled()
        this.socket = new WebSocket(wsUrlWithParams);

        this.socket.onopen = this.handleOpen;
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = this.handleError;

        this.callbacks?.onConnectionStateChange('connecting');
    }

    public disconnect() {
        if (CONFIG.DEBUG_WS) logger.log('[WS] Disconnecting...');
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }

        // Reject all pending actions
        this.pendingActions.forEach((action) => {
            clearTimeout(action.timeout);
            action.reject(new Error('WebSocket disconnected'));
        });
        this.pendingActions.clear();

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.callbacks?.onConnectionStateChange('disconnected');
    }

    /**
     * Issue #125: Send an action to the server and wait for ACK
     */
    public async sendAction<T = any>(action: string, payload: any = {}): Promise<T> {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        const actionId = generateUUID();
        const message = {
            type: 'CLIENT_ACTION',
            action,
            actionId,
            payload
        };

        return new Promise<T>((resolve, reject) => {
            // Set timeout for 5 seconds
            const timeout = setTimeout(() => {
                if (this.pendingActions.has(actionId)) {
                    this.pendingActions.delete(actionId);
                    reject(new Error(`Action ${action} timed out`));
                }
            }, 5000);

            this.pendingActions.set(actionId, { resolve, reject, timeout });

            if (CONFIG.DEBUG_WS) logger.log('[WS] Sending Action:', action, actionId);
            this.socket?.send(JSON.stringify(message));
        });
    }

    /**
     * Performs admin login using an isolated temporary WebSocket connection.
     * 
     * Uses a separate socket (not this.socket) to prevent interference with
     * the main persistent connection. The login socket is closed immediately
     * after receiving authentication response.
     * 
     * @returns LoginResult with sessionId, token, and userId on success
     */
    public async login(username: string, password: string): AsyncResult<LoginResult> {
        return new Promise((resolve) => {
            const tempSocket = new WebSocket(CONFIG.WS_URL + `?username=${username}&admin=true`);
            const timeout = setTimeout(() => {
                tempSocket.close();
                resolve({ success: false, error: new Error('Login timed out') });
            }, 10000);

            tempSocket.onopen = () => {
                tempSocket.send(JSON.stringify({
                    action: 'admin-login',
                    username,
                    password
                }));
            };

            tempSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'admin-login-success' || data.type === 'session-joined') {
                        clearTimeout(timeout);
                        tempSocket.close();
                        resolve({
                            success: true,
                            data: {
                                sessionId: data.sessionId,
                                token: data.authToken,
                                userId: data.username
                            }
                        });
                    } else if (data.type === 'error') {
                        clearTimeout(timeout);
                        tempSocket.close();
                        resolve({ success: false, error: new Error(data.message || 'Login failed') });
                    }
                } catch (e) {
                    clearTimeout(timeout);
                    tempSocket.close();
                    resolve({ success: false, error: e as Error });
                }
            };

            tempSocket.onerror = (err) => {
                clearTimeout(timeout);
                tempSocket.close();
                resolve({ success: false, error: new Error('Network error during login') });
            };
        });
    }
    /**
     * Joins a session as a guest.
     * Establishes a persistent connection and sends the join-session action.
     */
    public async joinSession(joinCode: string, username: string): AsyncResult<any> {
        return new Promise((resolve) => {
            // 1. Connect
            this.disconnect(); // Ensure clean slate
            this.connect(username);

            // 2. Wait for connection and join
            const timeout = setTimeout(() => {
                resolve({ success: false, error: new Error('Connection timed out') });
            }, 10000);

            const onConnect = (state: string) => {
                if (state === 'connected') {
                    // Connection successful, now send join action
                    this.sendAction('join-session', { joinCode })
                        .then((response: any) => {
                            clearTimeout(timeout);
                            resolve({ success: true, data: response });
                        })
                        .catch((err) => {
                            clearTimeout(timeout);
                            this.disconnect();
                            resolve({ success: false, error: err });
                        });
                }
            };

            // Temporary callback interception to detect connection
            // In a real app, we might use a purely event-driven approach or a dedicated promise-based connect()
            const originalCallback = this.callbacks?.onConnectionStateChange;
            if (this.callbacks) {
                this.callbacks.onConnectionStateChange = (state) => {
                    originalCallback?.(state);
                    onConnect(state);
                };
            } else {
                // Should link callbacks before calling joinSession in the UI
                logger.warn('[WS] joinSession called without callbacks registered');
            }
        });
    }

    private handleOpen = () => {
        logger.log('[WS] Connected');
        this.reconnectAttempts = 0;

        // Issue #68: Message-based authentication handshake
        if (CONFIG.USE_MESSAGE_AUTH && (this.currentConfig?.authToken || this.currentConfig?.sessionSecret)) {
            if (CONFIG.DEBUG_WS) logger.log('[WS] Sending authenticate message');
            this.socket?.send(JSON.stringify({
                action: 'authenticate',
                authToken: this.currentConfig.authToken,
                sessionId: this.currentConfig.sessionId,
                sessionSecret: this.currentConfig.sessionSecret,
                username: this.currentConfig.username
            }));

            // Set a timeout for authentication confirmation
            this.authTimeout = setTimeout(() => {
                logger.error('[WS] Authentication timed out');
                this.disconnect();
                this.callbacks?.onError(new Error('Authentication timed out'));
            }, 10000);
        } else if (!this.currentConfig?.username) {
            // No credentials and no user? This shouldn't really happen if connect was called correctly
            this.callbacks?.onConnectionStateChange('connected');
        } else {
            // Legacy mode or guest connection
            this.callbacks?.onConnectionStateChange('connected');
        }

        // Issue #125: Send Protocol Handshake (Graceful Degradation: Old servers will ignore this)
        this.socket?.send(JSON.stringify({
            type: 'PROTOCOL_HANDSHAKE',
            version: PROTOCOL_VERSION,
            capabilities: ['bin_sync', 'session_mgmt']
        }));
    };

    private handleMessage = (event: MessageEvent) => {
        try {
            const rawData = JSON.parse(event.data);
            const validation = WebSocketMessageSchema.safeParse(rawData);

            if (!validation.success) {
                if (CONFIG.DEBUG_WS) logger.log('[WS] Message validation failed:', validation.error);
                return;
            }

            const data = validation.data;
            const type = data.type || (data as any).messageType;
            if (CONFIG.DEBUG_WS && type !== 'now-playing') logger.log('[WS] Raw:', type, data);

            // Always emit raw message for flexible consumption
            this.callbacks?.onMessage(data as unknown as WebSocketMessage);

            // Issue #125: Handle Action ACKs
            if (type === 'ACTION_ACK' && data.actionId) {
                const pending = this.pendingActions.get(data.actionId);
                if (pending) {
                    clearTimeout(pending.timeout);
                    this.pendingActions.delete(data.actionId);
                    if (data.status === 'success') {
                        pending.resolve(data.data);
                    } else {
                        pending.reject(new Error(data.error || 'Action failed'));
                    }
                }
                return;
            }

            // Issue #125: Handle Protocol ACK
            if (type === 'PROTOCOL_ACK') {
                const ackValidation = ProtocolAckSchema.safeParse(data);
                if (ackValidation.success) {
                    if (CONFIG.DEBUG_WS) logger.log('[WS] Protocol Handshake ACK:', ackValidation.data.enabledFeatures);
                    // Store enabledFeatures in SessionStore
                    // Implements feature negotiation from Issue #125
                    const { setEnabledFeatures } = require('@/store/useSessionStore').useSessionStore.getState();
                    setEnabledFeatures(ackValidation.data.enabledFeatures);
                }
                return;
            }

            // Semantic Event Emission (Architectural Cleanup)
            switch (type) {
                case 'WELCOME':
                case 'welcome':
                case 'SESSION_JOINED':
                case 'session-joined':
                case 'admin-login-success':
                    if (this.authTimeout) {
                        global.clearTimeout(this.authTimeout);
                        this.authTimeout = null;
                    }
                    this.callbacks?.onConnectionStateChange('connected');
                    this.callbacks?.onSessionJoined?.({
                        sessionId: data.sessionId || '',
                        authToken: data.authToken,
                        username: data.username
                    });
                    break;
                case 'AUTH_SUCCESS':
                case 'auth-success':
                    if (this.authTimeout) {
                        global.clearTimeout(this.authTimeout);
                        this.authTimeout = null;
                    }
                    this.callbacks?.onConnectionStateChange('connected');
                    break;
                case 'AUTH_ERROR':
                case 'auth-error':
                case 'error':
                    if (this.authTimeout) {
                        global.clearTimeout(this.authTimeout);
                        this.authTimeout = null;
                    }
                    if (type === 'AUTH_ERROR' || type === 'auth-error' || (type === 'error' && data.message?.includes('auth'))) {
                        this.callbacks?.onError(new Error(data.message || 'Authentication failed'));
                        this.disconnect();
                    }
                    break;
                case 'NOW_PLAYING':
                case 'now-playing':
                    if (data.album) {
                        const { album } = data;
                        this.callbacks?.onNowPlaying?.({
                            track: album.title,
                            artist: album.artist,
                            album: album.title,
                            albumArt: album.coverImage,
                            releaseId: String(album.releaseId)
                        });
                    }
                    break;
                case 'SESSION_ENDED':
                case 'session-ended':
                    this.callbacks?.onSessionEnded?.();
                    break;
                case 'ACCESS_LEVEL':
                case 'access-level':
                    if (this.authTimeout) {
                        global.clearTimeout(this.authTimeout);
                        this.authTimeout = null;
                    }
                    if (data.message) {
                        this.callbacks?.onAccessLevel?.(data.message);
                    }
                    break;
                // Issue #126: Handle both mobile-specific BIN_STATE and generic state messages
                case 'BIN_STATE':
                case 'bin-state':
                case 'state':
                    if (data.bin || data.payload || data.albums) {
                        const items = (data.bin || data.payload || data.albums) as any[];
                        this.callbacks?.onBinState?.(items);

                        // Notify dedicated listeners
                        this.binStateListeners.forEach(listener => {
                            try { listener(items); } catch (e) { logger.error('[WS] Bin listener error', e); }
                        });
                    }
                    break;
            }
        } catch (e) {
            logger.error('[WS] Failed to parse message', e);
        }
    };

    private handleClose = (event: CloseEvent) => {
        logger.log('[WS] Disconnected', event.code, event.reason);
        this.callbacks?.onConnectionStateChange('disconnected');

        if (this.shouldReconnect) {
            this.callbacks?.onConnectionStateChange('reconnecting');
            this.attemptReconnect();
        }
    };

    private handleError = (event: Event) => {
        logger.log('[WS] Connection failed (retrying...)');
        this.callbacks?.onError(new Error('WebSocket connection error'));
    };

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.warn('[WS] Max reconnect attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        logger.log(`[WS] Reconnecting in ${delay}ms...`);

        this.reconnectAttempts++;
        this.reconnectTimeout = setTimeout(() => {
            if (this.currentConfig) {
                this.connect(
                    this.currentConfig.username,
                    this.currentConfig.authToken,
                    this.currentConfig.sessionId,
                    this.currentConfig.sessionSecret
                );
            }
        }, delay);
    }

    public setCallbacks(callbacks: WebSocketCallbacks) {
        // Inject persistent listener if present
        if (this.extraOnNowPlaying) {
            const newCallback = callbacks.onNowPlaying;
            const extra = this.extraOnNowPlaying;
            callbacks.onNowPlaying = (data) => {
                // Call original hook's listener (e.g. for banner)
                if (newCallback) newCallback(data);
                // Call extra listener (e.g. for Daily Spin)
                extra(data);
            };
        }
        this.callbacks = callbacks;
    }

    public clearCallbacks() {
        this.callbacks = null;
    }

    public addCallback<T>(event: string, callback: (data: T) => void): () => void {
        if (event === 'onNowPlaying') {
            this.extraOnNowPlaying = callback as any;

            // Should also inject into current callbacks if they exist
            if (this.callbacks) {
                const currentCallback = this.callbacks.onNowPlaying;
                this.callbacks.onNowPlaying = (data) => {
                    if (currentCallback) currentCallback(data);
                    callback(data as any);
                };
            }
        }

        return () => {
            this.extraOnNowPlaying = undefined;
        };
    }

    public addBinStateListener(listener: (items: any[]) => void): () => void {
        this.binStateListeners.push(listener);
        return () => {
            this.binStateListeners = this.binStateListeners.filter(l => l !== listener);
        };
    }
}

export const wsService = WebSocketService.getInstance();
