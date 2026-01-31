/**
 * Domain types for Social Vinyl Mobile
 */

export interface Release {
    id: number;
    title: string;
    artist: string;
    thumb_url: string | null;
    added_at: number;
    year?: string;
    genres?: string;
    label?: string;
    format?: string;
    tracks?: string; // JSON String
}

export interface NowPlaying {
    title: string;
    artist: string;
    releaseId: string;
    coverInfo?: {
        pixelUri?: string;
    };
}

export interface BinItem extends Release {
    addedTimestamp: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

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
    payload?: any;
    sessionId?: string;
    authToken?: string;
    username?: string;
    album?: {
        title: string;
        artist: string;
        releaseId: number;
        coverImage: string;
    };
    message?: string;
}

/**
 * Service Interfaces (Contracts)
 */

export interface IWebSocketService {
    connect(): void;
    disconnect(): void;
    login(username: string, password: string): Promise<void>;
}

export interface IDatabaseService {
    init(): Promise<void>;
    saveRelease(release: Release): Promise<void>;
    saveReleasesBatch(releases: Release[]): Promise<void>;
    getReleases(limit?: number, offset?: number, searchQuery?: string): Promise<Release[]>;
    updateReleaseTracks(id: number, tracksJson: string): Promise<void>;
    clear(): Promise<void>;
}

export interface ICollectionSyncService {
    syncCollection(): Promise<void>;
    isSyncing(): boolean;
}

export interface IAuthService {
    login(username: string, password: string): Promise<void>;
    logout(): void;
    isAuthenticated(): boolean;
}
