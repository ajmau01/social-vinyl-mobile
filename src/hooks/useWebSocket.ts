import { useEffect, useCallback } from 'react';
import { wsService } from '@/services/WebSocketService';
import { useSessionStore } from '@/store/useSessionStore';
import { ConnectionState, NowPlaying } from '@/types';

export interface UseWebSocketResult {
    connectionState: ConnectionState;
    isConnected: boolean;
    isConnecting: boolean;
    sessionId: string | null;
    nowPlaying: NowPlaying | null;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    login: (username: string, token: string) => Promise<void>;
}

/**
 * useWebSocket Hook
 * 
 * Provides reactive access to the WebSocket service, including connection state,
 * session information, and actions for managing the connection.
 */
export const useWebSocket = (): UseWebSocketResult => {
    const {
        connectionState,
        sessionId,
        nowPlaying,
        error,
        setConnectionState,
        setSessionId,
        setNowPlaying,
        setError
    } = useSessionStore();

    useEffect(() => {
        const callbacks = {
            onConnectionStateChange: (state: ConnectionState) => {
                setConnectionState(state);
                if (state === 'connected') {
                    setError(null);
                }
            },
            onMessage: (message: any) => {
                const type = message.type || message.messageType;
                const payload = message.payload || message;

                if (type === 'SESSION_JOINED' || type === 'session-joined') {
                    setSessionId(payload.sessionId || message.sessionId);
                } else if (type === 'NOW_PLAYING' || type === 'now-playing') {
                    setNowPlaying(payload as NowPlaying);
                }
            },
            onError: (err: Error) => {
                setError(err);
                setConnectionState('disconnected');
            }
        };

        wsService.setCallbacks(callbacks);

        return () => {
            // Fix memory leak by clearing callbacks on unmount
            wsService.clearCallbacks();
        };
    }, [setConnectionState, setSessionId, setNowPlaying, setError]);

    const connect = useCallback(() => {
        wsService.connect();
    }, []);

    const disconnect = useCallback(() => {
        wsService.disconnect();
    }, []);

    const login = useCallback(async (username: string, token: string) => {
        try {
            const result = await wsService.login(username, token);
            if (!result.success) {
                throw result.error;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }, [setError]);

    return {
        connectionState,
        isConnected: connectionState === 'connected',
        isConnecting: connectionState === 'connecting' || connectionState === 'reconnecting',
        sessionId,
        nowPlaying,
        error,
        connect,
        disconnect,
        login
    };
};
