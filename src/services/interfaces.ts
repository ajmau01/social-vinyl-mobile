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
    Release
} from '@/types';

/**
 * WebSocket Service Interface
 * Manages WebSocket connections and authentication
 */
export interface IWebSocketService {
    setCallbacks(callbacks: WebSocketCallbacks): void;
    clearCallbacks(): void;
    connect(username: string, authToken?: string): void;
    disconnect(): void;
    login(username: string, password: string): AsyncResult<LoginResult>;
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
    clearUserCollection(userId: string): Promise<void>;
    clearAll(): Promise<void>;
}
