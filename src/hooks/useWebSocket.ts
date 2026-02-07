import { useEffect, useCallback } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { ConnectionState, NowPlaying, Result, LoginResult, WebSocketMessage } from '@/types';

export interface UseWebSocketResult {
    connectionState: ConnectionState;
    isConnected: boolean;
    isConnecting: boolean;
    sessionId: string | null;
    nowPlaying: NowPlaying | null;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    login: (username: string, password: string) => Promise<Result<LoginResult>>;
}

/**
 * useWebSocket Hook
 * 
 * Provides reactive access to the WebSocket service, including connection state,
 * session information, and actions for managing the connection.
 */
export const useWebSocket = (): UseWebSocketResult => {
    const { webSocketService } = useServices();
    const {
        connectionState,
        sessionId,
        nowPlaying,
        error,
        username,
        authToken,
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
            onMessage: (message: WebSocketMessage) => {
                const type = message.type || message.messageType;
                const payload = message.payload || message;

                if (type === 'SESSION_JOINED' || type === 'session-joined') {
                    // Check for sessionId in message first, then in payload
                    const sessionId = message.sessionId ||
                        (payload && typeof payload === 'object' && 'sessionId' in payload
                            ? (payload as { sessionId?: string }).sessionId
                            : undefined);
                    if (sessionId) setSessionId(sessionId);
                } else if (type === 'NOW_PLAYING' || type === 'now-playing') {
                    setNowPlaying(payload as NowPlaying);
                }
            },
            onError: (err: Error) => {
                setError(err.message);
                setConnectionState('disconnected');
            }
        };

        webSocketService.setCallbacks(callbacks);

        return () => {
            // Fix memory leak by clearing callbacks on unmount
            webSocketService.clearCallbacks();
        };
    }, [webSocketService, setConnectionState, setSessionId, setNowPlaying, setError]);

    const connect = useCallback(() => {
        if (username) {
            webSocketService.connect(username, authToken || undefined);
        }
    }, [webSocketService, username, authToken]);

    const disconnect = useCallback(() => {
        webSocketService.disconnect();
    }, [webSocketService]);

    const login = useCallback(async (username: string, password: string): Promise<Result<LoginResult>> => {
        const result = await webSocketService.login(username, password);
        if (!result.success) {
            setError(result.error.message);
        }
        return result;
    }, [webSocketService, setError]);

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
