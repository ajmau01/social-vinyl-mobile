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
        console.log('[WS] Connecting to:', CONFIG.WS_URL);

        this.socket = new WebSocket(CONFIG.WS_URL);

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
            const data = JSON.parse(event.data) as WebSocketMessage;
            console.log('[WS] Received:', data.type);

            switch (data.type) {
                case 'WELCOME':
                    if (data.payload?.sessionId) {
                        useSessionStore.getState().setSessionId(data.payload.sessionId);
                    }
                    break;
                case 'NOW_PLAYING':
                    useSessionStore.getState().setNowPlaying(data.payload);
                    break;
                case 'SESSION_ENDED':
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
