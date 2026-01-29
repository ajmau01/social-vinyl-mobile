import { CONFIG } from '@/config';
import { useSessionStore, NowPlaying } from '@/store/useSessionStore';

type WebSocketMessage =
    | { type: 'WELCOME'; payload: { sessionId?: string } }
    | { type: 'NOW_PLAYING'; payload: NowPlaying }
    | { type: 'SESSION_ENDED'; payload?: any };

class WebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private shouldReconnect = true;

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connect() {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        const { username, authToken } = useSessionStore.getState();
        const watchedUsername = username; // For now, we watch our own bin

        if (!username) {
            if (CONFIG.DEBUG_WS) console.log('[WS] Skip connect: No username');
            useSessionStore.getState().setConnecting(false);
            return;
        }

        const params = new URLSearchParams({
            username,
            watchedUsername: watchedUsername || username
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
        useSessionStore.getState().setConnected(false);
    }

    public async login(username: string, password: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const loginTimeout = setTimeout(() => {
                this.socket?.close();
                reject(new Error('Login timed out. Check connection.'));
            }, 10000);

            if (this.socket?.readyState === WebSocket.OPEN) {
                this.socket.close();
            }

            const wsUrl = `${CONFIG.WS_URL}?username=default`;
            if (CONFIG.DEBUG_WS) console.log('[WS] Login connecting to:', wsUrl);

            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                this.socket?.send(JSON.stringify({
                    action: 'admin-login',
                    username,
                    password
                }));
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const type = data.type || data.messageType;

                    if (CONFIG.DEBUG_WS) console.log('[WS] Login received:', type, data);

                    // Support both admin-login-success and Atomic Login (session-joined with authToken)
                    if (type === 'admin-login-success' || (type === 'session-joined' && data.authToken)) {
                        clearTimeout(loginTimeout);
                        useSessionStore.getState().setAuthToken(data.authToken);
                        useSessionStore.getState().setUsername(data.username || username);
                        useSessionStore.getState().setLastMode('host');
                        resolve();
                    } else if (type === 'error') {
                        clearTimeout(loginTimeout);
                        reject(new Error(data.message || 'Login failed'));
                    }
                } catch (e) {
                    // Ignore parse errors for non-JSON heartbeat if they exist
                }
            };

            this.socket.onerror = (e) => {
                clearTimeout(loginTimeout);
                reject(new Error('Connection failed'));
            };

            this.socket.onclose = () => {
                useSessionStore.getState().setConnected(false);
            };
        });
    }

    private handleOpen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        useSessionStore.getState().setConnected(true);
        useSessionStore.getState().setConnecting(false);
    };

    private handleMessage = (event: MessageEvent) => {
        try {
            const rawData = JSON.parse(event.data);
            if (CONFIG.DEBUG_WS) console.log('[WS] Raw:', rawData);

            // Handle both UPPER_CASE and kebab-case types
            const type = rawData.type || rawData.messageType;

            switch (type) {
                case 'WELCOME':
                case 'welcome':
                case 'ACCESS_LEVEL':
                case 'access-level':
                case 'admin-login-success':
                    if (rawData.authToken) {
                        useSessionStore.getState().setAuthToken(rawData.authToken);
                    }
                    // If session ID is present, store it.
                    // Note: Current backend might send 'access-level' instead of 'welcome'
                    if (rawData.sessionId) {
                        useSessionStore.getState().setSessionId(rawData.sessionId);
                    }
                    if (CONFIG.DEBUG_WS) console.log('[WS] Welcome/Access:', rawData);
                    break;
                case 'NOW_PLAYING':
                case 'now-playing':
                    // Protocol: 'now-playing' has nested 'album' object
                    if (rawData.album) {
                        const { album } = rawData;
                        useSessionStore.getState().setNowPlaying({
                            title: album.title,
                            artist: album.artist,
                            releaseId: String(album.releaseId),
                            coverInfo: {
                                pixelUri: album.coverImage
                            }
                        });
                    }
                    break;
                case 'SESSION_ENDED':
                case 'session-ended':
                    useSessionStore.getState().setSessionId(null);
                    useSessionStore.getState().setNowPlaying(null);
                    break;
            }
        } catch (e) {
            console.error('[WS] Failed to parse message', e);
        }
    };

    private handleClose = (event: CloseEvent) => {
        console.log('[WS] Disconnected', event.code, event.reason);
        useSessionStore.getState().setConnected(false);

        if (this.shouldReconnect) {
            // Keep "Connecting" state true so UI doesn't flash while waiting for timer
            useSessionStore.getState().setConnecting(true);
            this.attemptReconnect();
        } else {
            useSessionStore.getState().setConnecting(false);
        }
    };

    private handleError = (event: Event) => {
        console.log('[WS] Connection failed (retrying...)');
        // Error will trigger onClose, so we handle logic there
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
            this.connect();
        }, delay);
    }
}

export const wsService = WebSocketService.getInstance();
