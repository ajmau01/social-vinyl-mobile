import { CONFIG } from '@/config';
import {
    NowPlaying,
    WebSocketMessage,
    WebSocketCallbacks,
    AsyncResult,
    LoginResult
} from '@/types';

class WebSocketService {
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

    public connect(username: string, authToken?: string) {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.currentConfig = { username, authToken };
        this.shouldReconnect = true;

        if (!username) {
            if (CONFIG.DEBUG_WS) console.log('[WS] Skip connect: No username');
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
        if (CONFIG.DEBUG_WS) console.log('[WS] Connecting to:', wsUrlWithParams);

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

    public async login(username: string, password: string): AsyncResult<LoginResult> {
        return new Promise((resolve) => {
            let tempSocket: WebSocket | null = null;
            const loginTimeout = setTimeout(() => {
                tempSocket?.close();
                resolve({ success: false, error: new Error('Login timed out. Check connection.') });
            }, 10000);

            const wsUrl = `${CONFIG.WS_URL}?username=default`;
            if (CONFIG.DEBUG_WS) console.log('[WS] Login connecting to:', wsUrl);

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
                    const data = JSON.parse(event.data);
                    const type = data.type || data.messageType;

                    if (CONFIG.DEBUG_WS) console.log('[WS] Login received:', type, data);

                    // Support both admin-login-success and Atomic Login (session-joined with authToken)
                    if (type === 'admin-login-success' || (type === 'session-joined' && data.authToken)) {
                        clearTimeout(loginTimeout);
                        tempSocket?.close(); // Close immediately on success
                        resolve({
                            success: true,
                            data: {
                                sessionId: data.sessionId || '',
                                token: data.authToken,
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
                if (CONFIG.DEBUG_WS) console.log('[WS] Login socket closed');
            };
        });
    }

    private handleOpen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.callbacks?.onConnectionStateChange('connected');
    };

    private handleMessage = (event: MessageEvent) => {
        try {
            const rawData = JSON.parse(event.data);
            if (CONFIG.DEBUG_WS) console.log('[WS] Raw:', rawData);

            // Emit raw message through callback
            this.callbacks?.onMessage(rawData);

            // Handle common internal state transitions if necessary, 
            // but primarily UI should respond to onMessage
        } catch (e) {
            console.error('[WS] Failed to parse message', e);
        }
    };

    private handleClose = (event: CloseEvent) => {
        console.log('[WS] Disconnected', event.code, event.reason);
        this.callbacks?.onConnectionStateChange('disconnected');

        if (this.shouldReconnect) {
            this.callbacks?.onConnectionStateChange('reconnecting');
            this.attemptReconnect();
        }
    };

    private handleError = (event: Event) => {
        console.log('[WS] Connection failed (retrying...)');
        this.callbacks?.onError(new Error('WebSocket connection error'));
    };

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('[WS] Max reconnect attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        console.log(`[WS] Reconnecting in ${delay}ms...`);

        this.reconnectAttempts++;
        this.reconnectTimeout = setTimeout(() => {
            if (this.currentConfig) {
                this.connect(this.currentConfig.username, this.currentConfig.authToken);
            }
        }, delay);
    }
}

export const wsService = WebSocketService.getInstance();
