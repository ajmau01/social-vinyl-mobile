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
        sessionSecret,
        setConnectionState,
        setSessionId,
        setSessionSecret,
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

                    const secret = message.sessionSecret ||
                        (payload && typeof payload === 'object' && 'sessionSecret' in payload
                            ? (payload as { sessionSecret?: string }).sessionSecret
                            : undefined);
                    if (secret) setSessionSecret(secret);
                } else if (type === 'NOW_PLAYING' || type === 'now-playing') {
                    // Normalize backend message to frontend NowPlaying interface
                    const raw = payload as any;
                    const normalized: NowPlaying = {
                        track: raw.album?.title || raw.track || '',
                        artist: raw.album?.artist || raw.artist || '',
                        album: raw.album?.title || raw.album || '',
                        albumArt: raw.album?.coverImage || raw.albumArt || '',
                        releaseId: raw.album?.releaseId?.toString() || raw.releaseId,
                        timestamp: raw.playedAt || raw.timestamp,
                        duration: raw.duration,
                        position: raw.position,
                        userHasLiked: raw.userHasLiked,
                        playedBy: raw.playedBy,
                        likeCount: raw.thumbCount ?? raw.likeCount
                    };
                    setNowPlaying(normalized);
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
    }, [webSocketService, setConnectionState, setSessionId, setSessionSecret, setNowPlaying, setError]);

    const connect = useCallback(() => {
        if (username) {
            webSocketService.connect(
                username,
                authToken || undefined,
                sessionId || undefined,
                sessionSecret || undefined
            );
        }
    }, [webSocketService, username, authToken, sessionId, sessionSecret]);

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
