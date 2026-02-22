/**
 * Service Interfaces for Dependency Injection
 * 
 * These interfaces define the public API contracts for services,
 * enabling dependency injection and easier testing with mocks.
 */

import {
    WebSocketCallbacks,
    AsyncResult,
    LoginResult,
    SyncCallbacks,
    SyncResult,
    Track,
    Release,
    SessionCreatedMessage,
    SessionJoinedMessage,
    SessionListMessage,
    SessionCard,
    SessionHistory,
    SessionPlay
} from '@/types';

/**
 * WebSocket Service Interface
 * Manages WebSocket connections and authentication
 */
export interface IWebSocketService {
    setCallbacks(callbacks: WebSocketCallbacks): void;
    clearCallbacks(): void;
    addCallback<T>(event: string, callback: (data: T) => void): () => void;
    connect(username: string, authToken?: string, sessionId?: string, sessionSecret?: string): void;
    disconnect(): void;
    login(username: string, password: string): AsyncResult<LoginResult>;
    sendAction<T = any>(action: string, payload?: any): Promise<T>;
}

/**
 * Collection Sync Service Interface
 * Handles syncing user collections from backend
 */
export interface ISyncService {
    syncCollection(userId: string, callbacks?: SyncCallbacks): AsyncResult<SyncResult>;
    isSyncing(userId?: string): boolean;
    fetchTracks(userId: string, releaseId: number): AsyncResult<Track[]>;
}


/**
 * Database Service Interface
 * Manages local SQLite database operations
 */
export interface IDatabaseService {
    init(): Promise<void>;
    saveRelease(release: Release): Promise<void>;
    saveReleasesBatch(releases: Release[]): Promise<void>;
    getReleases(userId: string, limit?: number, offset?: number): Promise<Release[]>;
    updateReleaseTracks(userId: string, releaseId: number, tracksJson: string): Promise<void>;
    toggleSaved(instanceId: number): Promise<boolean>;
    clearUserCollection(userId: string): Promise<void>;
    clearAll(): Promise<void>;

    // History methods
    createSession(session: SessionHistory): Promise<void>;
    endSession(sessionId: string, endedAt: number): Promise<void>;
    recordPlay(play: SessionPlay): Promise<void>;
    getSessionsHistory(limit?: number, offset?: number): Promise<SessionHistory[]>;
    getSessionById(sessionId: string): Promise<SessionHistory | null>;
    getSessionSetlist(sessionId: string): Promise<SessionPlay[]>;
}

/**
 * Session Service Interface
 * Coordinates session lifecycles for Issue #128 parity.
 */
export interface ISessionService {
    createSession(name: string, permanent: boolean): Promise<AsyncResult<SessionCreatedMessage>>;
    joinSession(code: string, username: string): Promise<AsyncResult<SessionJoinedMessage>>;
    leaveSession(): Promise<AsyncResult<void>>;
    archiveSession(sessionId: number): Promise<AsyncResult<void>>;
    getSessions(): Promise<SessionCard[]>;
    setBroadcast(sessionId: number): Promise<AsyncResult<void>>;
    setDisplayName(name: string): void;
}
