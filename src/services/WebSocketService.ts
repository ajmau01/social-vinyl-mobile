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
import { AuthResponseSchema, WebSocketMessageSchema } from '@/types/schemas';

class WebSocketService implements IWebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private shouldReconnect = true;
    private callbacks: WebSocketCallbacks | null = null;
    private currentConfig: { username: string; authToken?: string } | null = null;

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public setCallbacks(callbacks: WebSocketCallbacks) {
        this.callbacks = callbacks;
    }

    public clearCallbacks() {
        this.callbacks = null;
    }

    public connect(username: string, authToken?: string) {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.currentConfig = { username, authToken };
        this.shouldReconnect = true;

        if (!username) {
            if (CONFIG.DEBUG_WS) logger.log('[WS] Skip connect: No username');
            this.callbacks?.onConnectionStateChange('disconnected');
            return;
        }

        const params = new URLSearchParams({
            username,
            watchedUsername: username // For now, we watch our own bin
        });

        if (authToken) {
            params.append('authToken', authToken);
        }

        const wsUrlWithParams = `${CONFIG.WS_URL}?${params.toString()}`;
        if (CONFIG.DEBUG_WS) logger.log('[WS] Connecting to:', wsUrlWithParams);

        this.socket = new WebSocket(wsUrlWithParams);

        this.socket.onopen = this.handleOpen;
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = this.handleError;

        this.callbacks?.onConnectionStateChange('connecting');
    }

    public disconnect() {
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.callbacks?.onConnectionStateChange('disconnected');
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
            let tempSocket: WebSocket | null = null;
            const loginTimeout = setTimeout(() => {
                tempSocket?.close();
                resolve({ success: false, error: new Error('Login timed out. Check connection.') });
            }, 10000);

            const wsUrl = `${CONFIG.WS_URL}?username=default`;
            if (CONFIG.DEBUG_WS) logger.log('[WS] Login connecting to:', wsUrl);

            tempSocket = new WebSocket(wsUrl);

            tempSocket.onopen = () => {
                tempSocket?.send(JSON.stringify({
                    action: 'admin-login',
                    username,
                    password
                }));
            };

            tempSocket.onmessage = (event) => {
                try {
                    const rawData = JSON.parse(event.data);
                    const validation = AuthResponseSchema.safeParse(rawData);

                    if (!validation.success) {
                        if (CONFIG.DEBUG_WS) logger.log('[WS] Login validation failed:', validation.error);
                        return; // Ignore malformed auth messages
                    }

                    const data = validation.data;
                    const type = data.type || (data as any).messageType; // messageType fallback for back compat

                    if (CONFIG.DEBUG_WS) logger.log('[WS] Login received:', type, data);

                    // Support both admin-login-success and Atomic Login (session-joined with authToken)
                    if (type === 'admin-login-success' || (type === 'session-joined' && data.authToken)) {
                        clearTimeout(loginTimeout);
                        tempSocket?.close(); // Close immediately on success
                        resolve({
                            success: true,
                            data: {
                                sessionId: data.sessionId || '',
                                token: data.authToken as string,
                                userId: data.username || username
                            }
                        });
                    } else if (type === 'error') {
                        clearTimeout(loginTimeout);
                        tempSocket?.close();
                        resolve({ success: false, error: new Error(data.message || 'Login failed') });
                    }
                } catch (e) {
                    // Ignore parse errors for non-JSON heartbeat
                }
            };

            tempSocket.onerror = (e) => {
                clearTimeout(loginTimeout);
                tempSocket?.close();
                resolve({ success: false, error: new Error('Connection failed') });
            };

            tempSocket.onclose = () => {
                // If this happens unexpectedly before resolve
                if (CONFIG.DEBUG_WS) logger.log('[WS] Login socket closed');
            };
        });
    }

    private handleOpen = () => {
        logger.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.callbacks?.onConnectionStateChange('connected');
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
            if (CONFIG.DEBUG_WS) logger.log('[WS] Raw:', type, data);

            // Always emit raw message for flexible consumption
            this.callbacks?.onMessage(data as unknown as WebSocketMessage);

            // Semantic Event Emission (Architectural Cleanup)
            switch (type) {
                case 'WELCOME':
                case 'welcome':
                case 'SESSION_JOINED':
                case 'session-joined':
                case 'admin-login-success':
                    this.callbacks?.onSessionJoined?.({
                        sessionId: data.sessionId || '',
                        authToken: data.authToken,
                        username: data.username
                    });
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
                    if (data.message) {
                        this.callbacks?.onAccessLevel?.(data.message);
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
                this.connect(this.currentConfig.username, this.currentConfig.authToken);
            }
        }, delay);
    }
}

export const wsService = WebSocketService.getInstance();
