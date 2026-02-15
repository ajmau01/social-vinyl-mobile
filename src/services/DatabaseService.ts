import * as SQLite from 'expo-sqlite';

import { Release } from '@/types';
import { logger } from '@/utils/logger';
import { IDatabaseService } from './interfaces';

export class DatabaseService implements IDatabaseService {
    private static instance: DatabaseService;
    private db: SQLite.SQLiteDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Ensure database is initialized and return it
     */
    private async ensureDb(): Promise<SQLite.SQLiteDatabase> {
        if (!this.db) await this.init();
        if (!this.db) throw new Error('[DatabaseService] Database initialization failed');
        return this.db;
    }

    public async init() {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                logger.log('[DB] Initializing SQLite...');
                this.db = await SQLite.openDatabaseAsync('social_vinyl.db');
                if (!this.db) throw new Error('Failed to open database');

                logger.log('[DB] Database opened. Checking schema...');

                // AGGRESSIVE SCHEMA MIGRATION: 
                // We must ensure 'instanceId' is the SOLE primary key.
                const tableInfo = await this.db.getAllAsync<{ name: string; pk: number }>("PRAGMA table_info(releases)");
                const pkCols = tableInfo.filter(col => col.pk > 0);
                const isCorrectPk = pkCols.length === 1 && pkCols[0].name === 'instanceId';

                // If the table exists but the PK is wrong (or missing instanceId), drop it.
                if (tableInfo.length > 0 && !isCorrectPk) {
                    logger.warn('[DB] Schema mismatch: Primary Key is not instanceId. Dropping releases table...');
                    await this.db.execAsync('DROP TABLE IF EXISTS releases');
                }

                // Ensure 'isSaved' column exists (Migration for Issue #105)
                const columns = await this.db.getAllAsync<{ name: string }>("PRAGMA table_info(releases)");
                const hasIsSaved = columns.some(col => col.name === 'isSaved');
                if (!hasIsSaved && columns.length > 0) {
                    logger.log('[DB] Migrating: Adding isSaved column...');
                    await this.db.execAsync('ALTER TABLE releases ADD COLUMN isSaved INTEGER DEFAULT 0');
                }

                // Ensure 'isNotable' column exists (Migration for Phase 9)
                const hasIsNotable = columns.some(col => col.name === 'isNotable');
                if (!hasIsNotable && columns.length > 0) {
                    logger.log('[DB] Migrating: Adding isNotable column...');
                    await this.db.execAsync('ALTER TABLE releases ADD COLUMN isNotable INTEGER DEFAULT 0');
                }

                await this.db.execAsync(`
                    CREATE TABLE IF NOT EXISTS releases (
                        id INTEGER NOT NULL,
                        instanceId INTEGER NOT NULL,
                        userId TEXT NOT NULL,
                        title TEXT NOT NULL,
                        artist TEXT NOT NULL,
                        thumb_url TEXT,
                        added_at INTEGER NOT NULL,
                        year TEXT,
                        genres TEXT,
                        label TEXT,
                        format TEXT,
                        tracks TEXT,
                        isSaved INTEGER DEFAULT 0,
                        isNotable INTEGER DEFAULT 0,
                        PRIMARY KEY (instanceId)
                    );

                    CREATE INDEX IF NOT EXISTS idx_releases_user ON releases(userId);
                    CREATE INDEX IF NOT EXISTS idx_releases_added_at ON releases(added_at);
                    CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist);
                    CREATE INDEX IF NOT EXISTS idx_releases_title ON releases(title);
                `);
                logger.log('[DB] Schema verified/initialized');
            } catch (error) {
                logger.error('[DB] Failed to initialize', error);
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    public async saveRelease(release: Release) {
        const db = await this.ensureDb();

        try {
            await db.runAsync(
                'INSERT OR REPLACE INTO releases (id, instanceId, userId, title, artist, thumb_url, added_at, year, genres, label, format, tracks, isSaved, isNotable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT isSaved FROM releases WHERE instanceId = ?), ?), COALESCE((SELECT isNotable FROM releases WHERE instanceId = ?), ?))',
                release.id,
                release.instanceId,
                release.userId,
                release.title,
                release.artist,
                release.thumb_url,
                release.added_at,
                release.year || null,
                release.genres || null,
                release.label || null,
                release.format || null,
                release.tracks || null,
                release.instanceId,
                release.isSaved ? 1 : 0,
                release.instanceId,
                release.isNotable ? 1 : 0
            );
        } catch (error) {
            logger.error('[DB] Failed to save release', error);
            throw error;
        }
    }

    public async saveReleasesBatch(releases: Release[]) {
        const db = await this.ensureDb();

        try {
            await db.withTransactionAsync(async () => {
                for (const release of releases) {
                    await db.runAsync(
                        'INSERT OR REPLACE INTO releases (id, instanceId, userId, title, artist, thumb_url, added_at, year, genres, label, format, tracks, isSaved, isNotable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT isSaved FROM releases WHERE instanceId = ?), ?), COALESCE((SELECT isNotable FROM releases WHERE instanceId = ?), ?))',
                        release.id,
                        release.instanceId,
                        release.userId,
                        release.title,
                        release.artist,
                        release.thumb_url,
                        release.added_at,
                        release.year || null,
                        release.genres || null,
                        release.label || null,
                        release.format || null,
                        release.tracks || null,
                        release.instanceId,
                        release.isSaved ? 1 : 0,
                        release.instanceId,
                        release.isNotable ? 1 : 0
                    );
                }
            });
        } catch (error) {
            logger.error('[DB] Failed to batch save releases', error);
            throw error;
        }
    }

    public async getReleases(userId: string, limit?: number, offset?: number): Promise<Release[]> {
        const db = await this.ensureDb();

        try {
            // Type for SQLite parameters
            type SQLiteParam = string | number | null | Uint8Array;

            let query = 'SELECT * FROM releases WHERE userId = ?';
            const params: SQLiteParam[] = [userId];

            query += ' ORDER BY added_at DESC, instanceId DESC';

            // Only add pagination if both limit and offset are provided
            if (limit !== undefined && offset !== undefined) {
                query += ' LIMIT ? OFFSET ?';
                params.push(limit, offset);
            }

            const rows = await db.getAllAsync<any>(query, params);
            return rows.map(row => ({
                ...row,
                isSaved: row.isSaved === 1,
                isNotable: row.isNotable === 1
            }));
        } catch (error) {
            logger.error('[DB] Failed to get releases', error);
            throw error;
        }
    }

    public async updateReleaseTracks(userId: string, releaseId: number, tracksJson: string) {
        const db = await this.ensureDb();
        await db.runAsync(
            'UPDATE releases SET tracks = ? WHERE id = ? AND userId = ?',
            tracksJson,
            releaseId,
            userId
        );
    }

    public async toggleSaved(instanceId: number): Promise<boolean> {
        const db = await this.ensureDb();
        try {
            await db.runAsync(
                'UPDATE releases SET isSaved = 1 - isSaved WHERE instanceId = ?',
                [instanceId]
            );

            const rows = await db.getAllAsync<{ isSaved: number }>(
                'SELECT isSaved FROM releases WHERE instanceId = ?',
                [instanceId]
            );
            return rows[0]?.isSaved === 1;
        } catch (error) {
            logger.error('[DB] Failed to toggle saved state', error);
            throw error;
        }
    }

    public async toggleNotable(instanceId: number): Promise<boolean> {
        const db = await this.ensureDb();
        try {
            await db.runAsync(
                'UPDATE releases SET isNotable = 1 - isNotable WHERE instanceId = ?',
                [instanceId]
            );

            const rows = await db.getAllAsync<{ isNotable: number }>(
                'SELECT isNotable FROM releases WHERE instanceId = ?',
                [instanceId]
            );
            return rows[0]?.isNotable === 1;
        } catch (error) {
            logger.error('[DB] Failed to toggle notable state', error);
            throw error;
        }
    }

    public async clearUserCollection(userId: string) {
        const db = await this.ensureDb();
        await db.runAsync('DELETE FROM releases WHERE userId = ?', userId);
    }

    public async clearAll() {
        const db = await this.ensureDb();
        await db.execAsync('DELETE FROM releases');
    }

    // Only for testing
    public _resetForTesting() {
        this.db = null;
        this.initPromise = null;
        // @ts-ignore - clearing singleton for test isolation
        DatabaseService.instance = null;
    }
}

export const dbService = DatabaseService.getInstance();
