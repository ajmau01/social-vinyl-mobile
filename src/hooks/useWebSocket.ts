import { useEffect, useCallback } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { dbService } from '@/services/DatabaseService';
import { ConnectionState, NowPlaying, Result, LoginResult, WebSocketMessage } from '@/types';
import { normalizeNowPlayingPayload } from '@/utils/normalization';
import { logger } from '@/utils/logger';

export interface UseWebSocketResult {
    connectionState: ConnectionState;
    isConnected: boolean;
    isConnecting: boolean;
    sessionId: string | number | null;
    nowPlaying: NowPlaying | null;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    login: (username: string, password: string) => Promise<Result<LoginResult>>;
    enabledFeatures: string[];
    isFeatureEnabled: (feature: string) => boolean;
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
        enabledFeatures,
        isFeatureEnabled,
        setConnectionState,
        setSessionId,
        setSessionSecret,
        setNowPlaying,
        setSessionRole,
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

                    // Issue #154: Persist local history on reconnect or first connect
                    if (sessionId) {
                        const isPayloadObj = payload && typeof payload === 'object';
                        dbService.createSession({
                            id: String(sessionId),
                            session_name: (isPayloadObj && (payload as any).name) || message.name || 'Unnamed Session',
                            host_username: (isPayloadObj && (payload as any).hostUsername) || message.hostUsername || useSessionStore.getState().username || 'unknown',
                            started_at: Date.now(),
                            ended_at: null,
                            mode: 'party',
                            guest_count: 0
                        }).catch(err => logger.error('[WebSocket] Failed to ensure session history exists', err));
                    }
                } else if (type === 'NOW_PLAYING' || type === 'now-playing') {
                    // Normalize backend message to frontend NowPlaying interface
                    const normalized = normalizeNowPlayingPayload(payload);
                    setNowPlaying(normalized);

                    // Issue #154: Persist to local history
                    const currentSessionId = useSessionStore.getState().sessionId;
                    if (currentSessionId && normalized && normalized.track) {
                        const playId = `${currentSessionId}-${normalized.timestamp || Date.now()}`;
                        logger.info(`[WebSocket] Recording play: ${normalized.track} by ${normalized.artist} in session ${currentSessionId}`);
                        dbService.recordPlay({
                            id: playId,
                            session_id: String(currentSessionId),
                            release_id: parseInt(normalized.releaseId || '0', 10),
                            release_title: normalized.album,
                            artist: normalized.artist,
                            album_art_url: normalized.albumArt || null,
                            played_at: normalized.timestamp || Date.now(),
                            picked_by_username: normalized.playedBy || null
                        }).catch(err => logger.error('[WebSocket] Failed to record play', err));
                    }
                } else if (type === 'now-playing-cleared') {
                    // Host explicitly stopped playback
                    setNowPlaying(null);
                } else if (type === 'STATE' || type === 'state') {
                    // Handle state message which contains nowPlaying
                    const rawState = payload as any;
                    if (rawState.nowPlaying) {
                        const normalized = normalizeNowPlayingPayload(rawState.nowPlaying);
                        setNowPlaying(normalized);

                        // Issue #154: Persist to local history
                        const currentSessionId = useSessionStore.getState().sessionId;
                        if (currentSessionId && normalized && normalized.track) {
                            const playId = `${currentSessionId}-${normalized.timestamp || Date.now()}`;
                            logger.info(`[WebSocket:State] Recording play: ${normalized.track} by ${normalized.artist} in session ${currentSessionId}`);
                            dbService.recordPlay({
                                id: playId,
                                session_id: String(currentSessionId),
                                release_id: parseInt(normalized.releaseId || '0', 10),
                                release_title: normalized.album,
                                artist: normalized.artist,
                                album_art_url: normalized.albumArt || null,
                                played_at: normalized.timestamp || Date.now(),
                                picked_by_username: normalized.playedBy || null
                            }).catch(err => logger.error('[WebSocket:State] Failed to record play', err));
                        }
                    }

                    // Issue #154: Sync full history from state payload
                    if (rawState.history && Array.isArray(rawState.history)) {
                        const currentSessionId = useSessionStore.getState().sessionId;
                        if (currentSessionId) {
                            // Eagerly create the session in the DB before inserting plays
                            // to satisfy the foreign key constraint because 'state' arrives before 'session-joined'
                            dbService.createSession({
                                id: String(currentSessionId),
                                session_name: rawState.sessionName || 'Unnamed Session',
                                host_username: rawState.hostUsername || useSessionStore.getState().username || 'unknown',
                                started_at: Date.now(),
                                ended_at: null,
                                mode: 'party',
                                guest_count: 0
                            }).then(() => {
                                // Now safe to insert plays
                                rawState.history.forEach((histItem: any) => {
                                    const playId = `${currentSessionId}-${histItem.playedAt}`;
                                    dbService.recordPlay({
                                        id: playId,
                                        session_id: String(currentSessionId),
                                        release_id: parseInt(histItem.releaseId?.toString() || '0', 10),
                                        release_title: histItem.title || '',
                                        artist: histItem.artist || '',
                                        album_art_url: histItem.coverImage || null,
                                        played_at: histItem.playedAt,
                                        picked_by_username: histItem.playedBy || null
                                    }).catch(err => { }); // Ignore DUPLICATE PK errors gracefully
                                });
                            }).catch(err => logger.error('[WebSocket:State] Failed to eagerly create session', err));
                        }
                    }
                    // REGRESSION FIX: Do NOT clear nowPlaying if state doesn't have it.
                    // State messages (bin updates) often omit nowPlaying.
                }
            },
            onError: (err: Error) => {
                setError(err.message);
                setConnectionState('disconnected');
            },
            onAccessLevel: (level: string) => {
                // Map access levels to session roles
                if (level === 'admin') {
                    setSessionRole('host');
                } else if (level === 'party') {
                    setSessionRole('guest');
                } else {
                    setSessionRole('voyeur');
                }
            }
        };

        webSocketService.setCallbacks(callbacks);

        return () => {
            // Fix memory leak by clearing callbacks on unmount
            webSocketService.clearCallbacks();
        };
    }, [webSocketService, setConnectionState, setSessionId, setSessionSecret, setNowPlaying, setSessionRole, setError]);

    const connect = useCallback(() => {
        if (username) {
            webSocketService.connect(
                username,
                authToken || undefined,
                sessionId ? sessionId.toString() : undefined,
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
        login,
        enabledFeatures,
        isFeatureEnabled
    };
};
