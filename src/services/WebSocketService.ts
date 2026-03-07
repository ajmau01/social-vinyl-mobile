// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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
import { useSessionStore } from '@/store/useSessionStore';

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
    private binStateListeners: ((data: { items: any[], hostUsername?: string }) => void)[] = [];

    // Temporary Message Listeners
    private messageListeners: Map<string, Array<(data: any) => void>> = new Map();

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }


    public connect(username: string, authToken?: string, sessionId?: string, sessionSecret?: string) {
        // BLOCK-1: Always update currentConfig when connect is called to ensure guards reflect latest intent
        const prevConfig = this.currentConfig;
        this.currentConfig = { username, authToken, sessionId, sessionSecret };
        this.shouldReconnect = true;

        if (this.socket?.readyState === WebSocket.OPEN) {
            // Only re-authenticate if the AUTH TOKEN itself changed.
            // Do NOT re-authenticate when sessionId/sessionSecret change reactively
            // after a session-joined message — those are already confirmed by the server
            // and re-authenticating would cascade into an authTimeout loop.
            if (CONFIG.USE_MESSAGE_AUTH && authToken && authToken !== prevConfig?.authToken) {
                if (CONFIG.DEBUG_WS) logger.log('[WS] Upgrading connection with new auth token');
                this.authenticate();
            }
            return;
        }

        // Issue: Handling CONNECTING state
        // If we are already connecting, just update the config. 
        // handleOpen will use the latest this.currentConfig when it fires.
        if (this.socket?.readyState === WebSocket.CONNECTING) {
            if (CONFIG.DEBUG_WS) logger.log('[WS] Connection in progress, updating config for auto-auth');
            return;
        }

        if (CONFIG.DEBUG_WS) logger.log('[WS] Connecting...');

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

    private authenticate() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        if (CONFIG.USE_MESSAGE_AUTH && (this.currentConfig?.authToken || this.currentConfig?.sessionSecret)) {
            if (CONFIG.DEBUG_WS) logger.log('[WS] Sending authenticate message');
            this.socket.send(JSON.stringify({
                action: 'authenticate',
                authToken: this.currentConfig.authToken,
                sessionId: this.currentConfig.sessionId,
                sessionSecret: this.currentConfig.sessionSecret,
                username: this.currentConfig.username
            }));

            // Set a timeout for authentication confirmation
            if (this.authTimeout) clearTimeout(this.authTimeout);
            this.authTimeout = setTimeout(() => {
                logger.error('[WS] Authentication timed out');
                this.disconnect();
                this.callbacks?.onError(new Error('Authentication timed out'));
            }, 10000);
        }
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
                    if ((data.type === 'admin-login-success' || data.type === 'session-joined') && data.authToken) {
                        clearTimeout(timeout);
                        tempSocket.close();
                        resolve({
                            success: true,
                            data: {
                                sessionId: data.sessionId ? String(data.sessionId) : undefined,
                                token: data.authToken,
                                userId: data.username,
                                sessionSecret: data.sessionSecret,
                                sessionName: data.name,
                                joinCode: data.joinCode,
                                hostUsername: data.hostUsername,
                                isPermanent: data.isPermanent
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
     * Registers a new host account using an isolated temporary WebSocket connection.
     * Mirrors the login() pattern exactly — separate socket, same LoginResult shape.
     */
    public async register(username: string, password: string, email: string): AsyncResult<LoginResult> {
        return new Promise((resolve) => {
            const tempSocket = new WebSocket(CONFIG.WS_URL + `?username=${username}&admin=true`);
            const timeout = setTimeout(() => {
                tempSocket.close();
                resolve({ success: false, error: new Error('Registration timed out') });
            }, 10000);

            tempSocket.onopen = () => {
                tempSocket.send(JSON.stringify({
                    action: 'register-host',
                    username,
                    password,
                    email
                }));
            };

            // Collect authToken from access-level, then wait for session-joined
            // which carries the full session payload (sessionId, joinCode, etc.).
            let collectedAuthToken: string | undefined;

            tempSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'access-level' && data.level === 'ADMIN' && data.authToken) {
                        // Store the token — session data arrives in the subsequent session-joined.
                        collectedAuthToken = data.authToken;
                    } else if (data.type === 'session-joined') {
                        const token = data.authToken || collectedAuthToken;
                        if (token) {
                            clearTimeout(timeout);
                            tempSocket.close();
                            resolve({
                                success: true,
                                data: {
                                    sessionId: data.sessionId ? String(data.sessionId) : undefined,
                                    token,
                                    userId: data.username,
                                    sessionSecret: data.sessionSecret,
                                    sessionName: data.name,
                                    joinCode: data.joinCode,
                                    hostUsername: data.hostUsername,
                                    isPermanent: data.isPermanent
                                }
                            });
                        }
                        // No token: this session-joined is from onOpen auto-join (LOCAL
                        // connections); keep waiting for the one from RegisterHostHandler
                        // which will include the authToken.
                    } else if (data.type === 'error') {
                        clearTimeout(timeout);
                        tempSocket.close();
                        resolve({ success: false, error: new Error(data.message || 'Registration failed') });
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
                resolve({ success: false, error: new Error('Network error during registration') });
            };
        });
    }

    /**
     * Links a Discogs account to the authenticated host user.
     * Sends link-discogs action on the persistent connection and resolves
     * when the backend emits a discogs-linked confirmation message.
     */
    public async linkDiscogs(discogsUsername: string, discogsToken: string): AsyncResult<{ discogsUsername: string; avatarUrl?: string }> {
        return new Promise((resolve) => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                resolve({ success: false, error: new Error('Not connected to server') });
                return;
            }

            const onLinked = (data: any) => {
                clearTimeout(timeout);
                this.removeListener('discogs-linked', onLinked);
                resolve({
                    success: true,
                    data: {
                        discogsUsername: data.discogsUsername,
                        avatarUrl: data.avatarUrl
                    }
                });
            };

            const timeout = setTimeout(() => {
                this.removeListener('discogs-linked', onLinked);
                resolve({ success: false, error: new Error('Link Discogs timed out') });
            }, 10000);

            this.addListener('discogs-linked', onLinked);

            this.socket.send(JSON.stringify({
                action: 'link-discogs',
                discogsUsername,
                discogsToken
            }));
        });
    }

    /**
     * Listen for a specific message type
     */
    public addListener(type: string, callback: (data: any) => void) {
        if (!this.messageListeners.has(type)) {
            this.messageListeners.set(type, []);
        }
        this.messageListeners.get(type)!.push(callback);
    }

    public removeListener(type: string, callback: (data: any) => void) {
        if (this.messageListeners.has(type)) {
            const listeners = this.messageListeners.get(type)!;
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Joins a session as a guest.
     * Establishes a persistent connection and sends the join-session action.
     */
    public async joinSession(joinCode: string, username: string, authToken?: string): AsyncResult<any> {
        try {
            // BLOCK-1 FIX: If already connected with matching credentials, skip reconnect
            const isAlreadyConnected = this.socket?.readyState === WebSocket.OPEN &&
                                     this.currentConfig?.username === username &&
                                     this.currentConfig?.authToken === authToken;

            if (!isAlreadyConnected) {
                if (CONFIG.DEBUG_WS) logger.log('[WS] joinSession: Reconnecting with guest credentials');
                this.disconnect();
                this.connect(username, authToken);
            } else {
                if (CONFIG.DEBUG_WS) logger.log('[WS] joinSession: Already connected with matching credentials, skipping reconnect');
            }

            // Issues #136 + #138: event-driven wait replaces 100ms polling loop
            await this.waitForConnection(10000);

            // Connection successful, now send join action
            const response = await this.sendAction('join-session', { joinCode, username });
            return { success: true, data: response };

        } catch (err: any) {
            this.disconnect();
            return { success: false, error: err };
        }
    }

    /**
     * Issues #136 + #138: Event-driven connection wait.
     * Subscribes to the store and resolves as soon as connectionState
     * transitions to 'connected'. Fast-fails on 'disconnected' (socket closed
     * before handshake). Rejects after timeoutMs if neither occurs.
     * Replaces the previous 100ms polling loop.
     */
    private waitForConnection(timeoutMs: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (useSessionStore.getState().connectionState === 'connected') {
                resolve();
                return;
            }

            // Declare before setTimeout so the timeout callback can reference it
            // without relying on const hoisting timing.
            let unsubscribe: (() => void) | null = null;

            const timeout = setTimeout(() => {
                unsubscribe?.();
                reject(new Error('Connection timed out'));
            }, timeoutMs);

            unsubscribe = useSessionStore.subscribe((state) => {
                if (state.connectionState === 'connected') {
                    clearTimeout(timeout);
                    unsubscribe?.();
                    resolve();
                } else if (state.connectionState === 'disconnected') {
                    clearTimeout(timeout);
                    unsubscribe?.();
                    reject(new Error('WebSocket closed during connection'));
                }
            });
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
                    const { setEnabledFeatures } = useSessionStore.getState();
                    setEnabledFeatures(ackValidation.data.enabledFeatures);

                    // FIX: Ensure we transition to connected state
                    this.callbacks?.onConnectionStateChange('connected');
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
                            releaseId: String(album.releaseId),
                            duration: data.duration,
                            position: data.position,
                            playedAt: data.playedAt, // Backend unit is ms
                            userHasLiked: data.userHasLiked,
                            likeCount: data.likeCount,
                            playedBy: data.playedBy
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
                    // FIX: access-level implies successful connection/auth
                    this.callbacks?.onConnectionStateChange('connected');
                    if (data.message) {
                        this.callbacks?.onAccessLevel?.(data.message);
                    }
                    break;
                // Issue #126: Handle both mobile-specific BIN_STATE and generic state messages
                case 'BIN_STATE':
                case 'bin-state':
                case 'state':
                    // FIX: Receiving state implies we are connected
                    this.callbacks?.onConnectionStateChange('connected');

                    if (data.bin || data.payload || data.albums) {
                        const items = (data.bin || data.payload || data.albums) as any[];
                        // Extract hostUsername if present (crucial for Play button logic)
                        const hostUsername = data.hostUsername || (data.payload as any)?.hostUsername;

                        this.callbacks?.onBinState?.(items);

                        // Notify dedicated listeners
                        this.binStateListeners.forEach(listener => {
                            try { listener({ items, hostUsername }); } catch (e) { logger.error('[WS] Bin listener error', e); }
                        });
                    }
                    break;
            }
            // Dispatch to temporary message listeners (used by SessionService for session-created, session-list, etc.)
            if (type && this.messageListeners.has(type)) {
                const listenersForType = this.messageListeners.get(type)!.slice();
                listenersForType.forEach(listener => {
                    try { listener(data); } catch (e) { logger.error('[WS] messageListener error for type:', type, e); }
                });
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

    public addBinStateListener(listener: (data: { items: any[], hostUsername?: string }) => void): () => void {
        this.binStateListeners.push(listener);
        return () => {
            this.binStateListeners = this.binStateListeners.filter(l => l !== listener);
        };
    }
}

export const wsService = WebSocketService.getInstance();
