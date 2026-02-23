import { useEffect, useCallback, useRef } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { ConnectionState, NowPlaying, Result, LoginResult, WebSocketMessage } from '@/types';
import { normalizeNowPlayingPayload } from '@/utils/normalization';
import { logger } from '@/utils/logger';

export interface UseWebSocketOptions {
    isManager?: boolean;
}

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
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketResult => {
    const { isManager = false } = options;
    const { webSocketService, databaseService } = useServices();
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

    // Issue #146: Local playback deduplication 
    const lastRecordedPlayRef = useRef<{ id: string, timestamp: number } | null>(null);

    useEffect(() => {
        if (!isManager) return;

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
                const currentSessionId = useSessionStore.getState().sessionId;

                if (type === 'SESSION_JOINED' || type === 'session-joined') {
                    // Check for sessionId in message first, then in payload
                    const sessionId = message.sessionId ||
                        (payload && typeof payload === 'object' && 'sessionId' in payload
                            ? (payload as { sessionId?: string }).sessionId
                            : undefined);

                    // If this is a NEW session (not a reconnect to the same one), clear stale bin items.
                    // On reconnect the server will push the current bin state immediately after.
                    if (sessionId && sessionId !== currentSessionId) {
                        useListeningBinStore.getState().setBin([]);
                    }

                    if (sessionId) setSessionId(sessionId);

                    const secret = message.sessionSecret ||
                        (payload && typeof payload === 'object' && 'sessionSecret' in payload
                            ? (payload as { sessionSecret?: string }).sessionSecret
                            : undefined);
                    if (secret) setSessionSecret(secret);

                    // Sync metadata if present in payload (Issue #142 Redesign V5.2)
                    const isPayloadObj = payload && typeof payload === 'object';
                    const store = useSessionStore.getState();
                    const name = (isPayloadObj && (payload as any).name) || message.name;
                    const code = (isPayloadObj && (payload as any).joinCode) || message.joinCode;
                    const host = (isPayloadObj && (payload as any).hostUsername) || message.hostUsername;
                    const perm = (isPayloadObj && (payload as any).isPermanent) !== undefined ? (isPayloadObj && (payload as any).isPermanent) : message.isPermanent;

                    if (name) store.setSessionName(name);
                    if (code) store.setJoinCode(code);
                    if (host) store.setHostUsername(host);
                    if (perm !== undefined) {
                        store.setIsPermanent(perm);
                        // Issue #146: Derive and set sessionMode
                        store.setSessionMode(perm ? 'live' : 'party');
                    }

                    // Update role dynamically
                    if (host && store.username && host.toLowerCase() === store.username.toLowerCase()) {
                        store.setSessionRole('host');
                    } else if (host) {
                        store.setSessionRole('guest');
                    }

                    // Issue #154: Persist local history on reconnect or first connect
                    if (sessionId) {
                        databaseService.createSession({
                            id: String(sessionId),
                            session_name: (isPayloadObj && (payload as any).name) || message.name || 'Unnamed Session',
                            host_username: (isPayloadObj && (payload as any).hostUsername) || message.hostUsername || useSessionStore.getState().username || 'unknown',
                            started_at: (isPayloadObj && (payload as any).startedAt) || message.startedAt || Date.now(),
                            ended_at: null,
                            mode: (isPayloadObj && (payload as any).isPermanent) ? 'live' : 'party',
                            guest_count: 0
                        }).catch(err => logger.error('[WebSocket] Failed to ensure session history exists', err));
                    }
                } else if (type === 'NOW_PLAYING' || type === 'now-playing') {
                    // Normalize backend message to frontend NowPlaying interface
                    const normalized = normalizeNowPlayingPayload(payload);
                    setNowPlaying(normalized);

                    // Issue #154: Persist to local history
                    if (currentSessionId && normalized && normalized.track) {
                        const playId = `${currentSessionId}-${normalized.releaseId}`;
                        const now = Date.now();

                        // Deduplication: Don't record same track in same session within 30s
                        if (lastRecordedPlayRef.current?.id === playId && (now - lastRecordedPlayRef.current.timestamp) < 30000) {
                            return;
                        }

                        logger.info(`[WebSocket] Recording play: ${normalized.track} by ${normalized.artist} in session ${currentSessionId}`);
                        lastRecordedPlayRef.current = { id: playId, timestamp: now };

                        databaseService.recordPlay({
                            id: `${playId}-${normalized.timestamp || now}`,
                            session_id: String(currentSessionId),
                            release_id: parseInt(normalized.releaseId || '0', 10),
                            release_title: normalized.album,
                            artist: normalized.artist,
                            album_art_url: normalized.albumArt || null,
                            played_at: normalized.timestamp || now,
                            picked_by_username: normalized.playedBy || null
                        }).catch(err => logger.error('[WebSocket] Failed to record play', err));
                    }
                } else if (type === 'now-playing-cleared') {
                    // Host explicitly stopped playback
                    setNowPlaying(null);
                } else if (type === 'SESSION_ENDED' || type === 'session-ended') {
                    const currentSessionId = useSessionStore.getState().sessionId;
                    if (currentSessionId) {
                        databaseService.endSession(String(currentSessionId), Date.now()).catch(err => logger.error('[WebSocket] Failed to mark session ended in DB', err));
                    }
                } else if (type === 'STATE' || type === 'state') {
                    // Handle state message which contains nowPlaying
                    const rawState = payload as any;
                    if (rawState.nowPlaying) {
                        const normalized = normalizeNowPlayingPayload(rawState.nowPlaying);
                        setNowPlaying(normalized);

                        // Issue #154: Persist to local history
                        if (currentSessionId && normalized && normalized.track) {
                            const playId = `${currentSessionId}-${normalized.releaseId}`;
                            const now = Date.now();

                            // Deduplication: Don't record same track in same session within 30s
                            if (lastRecordedPlayRef.current?.id === playId && (now - lastRecordedPlayRef.current.timestamp) < 30000) {
                                return;
                            }

                            logger.info(`[WebSocket:State] Recording play: ${normalized.track} by ${normalized.artist} in session ${currentSessionId}`);
                            lastRecordedPlayRef.current = { id: playId, timestamp: now };

                            databaseService.recordPlay({
                                id: `${playId}-${normalized.timestamp || now}`,
                                session_id: String(currentSessionId),
                                release_id: parseInt(normalized.releaseId || '0', 10),
                                release_title: normalized.album,
                                artist: normalized.artist,
                                album_art_url: normalized.albumArt || null,
                                played_at: normalized.timestamp || now,
                                picked_by_username: normalized.playedBy || null
                            }).catch(err => logger.error('[WebSocket:State] Failed to record play', err));
                        }
                    }

                    // Sync metadata from state (Issue #142 Redesign V5.2)
                    const store = useSessionStore.getState();
                    if (rawState.sessionName) store.setSessionName(rawState.sessionName);
                    if (rawState.joinCode) store.setJoinCode(rawState.joinCode);
                    if (rawState.hostUsername) {
                        store.setHostUsername(rawState.hostUsername);
                        // Update role dynamically
                        if (store.username && rawState.hostUsername.toLowerCase() === store.username.toLowerCase()) {
                            store.setSessionRole('host');
                        } else {
                            store.setSessionRole('guest');
                        }
                    }
                    if (rawState.isPermanent !== undefined) {
                        store.setIsPermanent(rawState.isPermanent);
                        // Issue #146: Update sessionMode from state
                        store.setSessionMode(rawState.isPermanent ? 'live' : 'party');
                    }

                    // Issue #154: Sync full history from state payload
                    if (rawState.history && Array.isArray(rawState.history)) {
                        const currentSessionId = useSessionStore.getState().sessionId;
                        if (currentSessionId) {
                            // Eagerly create the session in the DB before inserting plays
                            // to satisfy the foreign key constraint because 'state' arrives before 'session-joined'
                            databaseService.createSession({
                                id: String(currentSessionId),
                                session_name: rawState.sessionName || 'Unnamed Session',
                                host_username: rawState.hostUsername || useSessionStore.getState().username || 'unknown',
                                started_at: rawState.startedAt || Date.now(),
                                ended_at: null,
                                mode: rawState.isPermanent ? 'live' : 'party',
                                guest_count: 0
                            }).then(() => {
                                // Now safe to insert plays
                                rawState.history.forEach((histItem: any) => {
                                    const playId = `${currentSessionId}-${histItem.playedAt}`;
                                    databaseService.recordPlay({
                                        id: playId,
                                        session_id: String(currentSessionId),
                                        release_id: parseInt(histItem.releaseId?.toString() || '0', 10),
                                        release_title: histItem.title || '',
                                        artist: histItem.artist || '',
                                        album_art_url: histItem.coverImage || null,
                                        played_at: histItem.playedAt,
                                        picked_by_username: histItem.playedBy || null
                                    }).catch(err => { logger.warn('[WebSocket:State] Failed to record history play (duplicate ignored)', err.message); });
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
            webSocketService.clearCallbacks();
        };
    }, [webSocketService, setConnectionState, setSessionId, setSessionSecret, setNowPlaying, setSessionRole, setError, isManager]);

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
