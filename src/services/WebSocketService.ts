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

        useSessionStore.getState().setConnecting(true);

        // TODO: Get actual username/watchedUsername from user profile or settings
        // For now, hardcode to match the backend expectation (from legacy client analysis)
        const params = new URLSearchParams({
            username: 'MobileGuest',
            watchedUsername: 'ajmau' // Target the likely host
        });

        const wsUrlWithParams = `${CONFIG.WS_URL}?${params.toString()}`;
        console.log('[WS] Connecting to:', wsUrlWithParams);

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

    private handleOpen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        useSessionStore.getState().setConnected(true);
        useSessionStore.getState().setConnecting(false);
    };

    private handleMessage = (event: MessageEvent) => {
        try {
            const rawData = JSON.parse(event.data);

            // Handle both UPPER_CASE and kebab-case types
            const type = rawData.type || rawData.messageType;

            switch (type) {
                case 'WELCOME':
                case 'welcome':
                    // TODO: Check structure
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
        useSessionStore.getState().setConnecting(false);

        if (this.shouldReconnect) {
            this.attemptReconnect();
        }
    };

    private handleError = (event: Event) => {
        console.error('[WS] Error', event);
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
