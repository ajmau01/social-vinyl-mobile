/**
 * Domain types for Social Vinyl Mobile
 */

/**
 * Result Pattern (Critical for Phase 1)
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export interface WebSocketCallbacks {
    onConnectionStateChange(state: ConnectionState): void;
    onMessage(message: WebSocketMessage): void;
    onError(error: Error): void;
    // Semantic Callbacks for architectural cleanup
    onSessionJoined?(data: { sessionId: string; authToken?: string; username?: string }): void;
    onNowPlaying?(data: NowPlaying): void;
    onSessionEnded?(): void;
    onAccessLevel?(level: string): void;
}

export interface SyncCallbacks {
    onProgress(progress: number): void;
    onStatusChange(status: SyncStatus): void;
}

export interface Release {
    id: number;
    instanceId: number; // UNIQUE identifier from Discogs
    userId: string; // SCOPING: User ID for isolation
    title: string;
    artist: string;
    thumb_url: string | null;
    added_at: number;
    year?: string;
    genres?: string;
    label?: string;
    format?: string;
    tracks?: string; // JSON String
    isSaved?: boolean;
    isNotable?: boolean;
    spinCount?: number;
    playedAt?: number; // History timestamp (ms)
}

/**
 * NowPlaying Interface
 * Aligned with specification in Issue #23.
 */
export interface NowPlaying {
    track: string;
    artist: string;
    album: string;
    albumArt?: string;
    timestamp?: number;
    releaseId?: string; // Added for internal linking
}

export interface BinItem extends Release {
    addedTimestamp: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface Track {
    position: string;
    title: string;
    duration: string;
}

export interface BackendAlbum {
    id: number;
    title: string;
    artist: string;
    year?: number;
    thumb?: string;
    genre?: string;
    styles?: string[];
    format?: string;
    country?: string;
    label?: string;
    catno?: string;
    tracks?: Track[];
    isNotable?: boolean;
    isSaved?: boolean;
    addedTimestamp?: number;
    spinCount?: number;
}

export interface LoginResult {
    sessionId: string;
    token: string;
    userId?: string;
}

export interface SyncResult {
    itemCount: number;
    syncTime: number;
    avatarUrl?: string;
}

export interface ScanResponse {
    success: boolean;
    albums?: BackendAlbum[];
    error?: string;
}

export interface SyncState {
    status: SyncStatus;
    progress: number;
    lastSyncTime: number | null;
    error?: string;
}

/**
 * WebSocket Protocol Types
 */

export type WebSocketMessageType =
    | 'WELCOME' | 'welcome'
    | 'ACCESS_LEVEL' | 'access-level'
    | 'SESSION_JOINED' | 'session-joined'
    | 'NOW_PLAYING' | 'now-playing'
    | 'SESSION_ENDED' | 'session-ended'
    | 'ERROR' | 'error'
    | 'admin-login-success';

export interface WebSocketMessage {
    type?: WebSocketMessageType;
    messageType?: WebSocketMessageType;
    payload?: LoginResult | SyncResult | NowPlaying | { message: string } | Record<string, unknown>;
    sessionId?: string;
    authToken?: string;
    sessionSecret?: string;
    username?: string;
    album?: {
        title: string;
        artist: string;
        releaseId: number;
        instanceId?: number;
        coverImage: string;
        tracks?: Track[];
    };
    message?: string;
}

/**
 * Service Interfaces (Contracts)
 * Note: These are evolving and will be fully defined in Phase 4 (Dependency Injection).
 */

export interface IWebSocketService {
    connect(): void;
    disconnect(): void;
    login(username: string, password: string): AsyncResult<LoginResult>;
    setCallbacks(callbacks: WebSocketCallbacks): void;
    clearCallbacks(): void;
}

export interface IDatabaseService {
    init(): Promise<void>;
    saveRelease(release: Release): Promise<void>;
    saveReleasesBatch(releases: Release[]): Promise<void>;
    getReleases(userId: string, limit?: number, offset?: number, searchQuery?: string): Promise<Release[]>;
    updateReleaseTracks(userId: string, releaseId: number, tracksJson: string): Promise<void>;
    clearUserCollection(userId: string): Promise<void>;
    clearAll(): Promise<void>;
    _resetForTesting(): void; // Added for completeness from previous work
}

export interface ICollectionSyncService {
    syncCollection(userId: string, callbacks?: SyncCallbacks): AsyncResult<SyncResult>;
    isSyncing(): boolean;
}

export interface IAuthService {
    login(username: string, password: string): Promise<void>;
    logout(): void;
    isAuthenticated(): boolean;
}
