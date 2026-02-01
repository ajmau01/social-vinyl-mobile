import * as SQLite from 'expo-sqlite';

import { Release } from '@/types';

class DatabaseService {
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

    public async init() {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('[DB] Initializing SQLite...');
                this.db = await SQLite.openDatabaseAsync('social_vinyl.db');
                if (!this.db) throw new Error('Failed to open database');

                console.log('[DB] Database opened. Checking schema...');

                // SCEMA MIGRATION (Phase 0.5): Detect if userId column is missing
                // This handles users who didn't fully uninstall before the update.
                const tableInfo = await this.db.getAllAsync<{ name: string }>("PRAGMA table_info(releases)");
                const hasUserId = tableInfo.some(col => col.name === 'userId');

                if (tableInfo.length > 0 && !hasUserId) {
                    console.warn('[DB] Schema mismatch: missing userId column. Dropping releases table...');
                    await this.db.execAsync('DROP TABLE IF EXISTS releases');
                }

                await this.db.execAsync(`
                    CREATE TABLE IF NOT EXISTS releases (
                        id INTEGER NOT NULL,
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
                        PRIMARY KEY (id, userId)
                    );

                    CREATE INDEX IF NOT EXISTS idx_releases_user ON releases(userId);
                    CREATE INDEX IF NOT EXISTS idx_releases_added_at ON releases(added_at);
                    CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist);
                    CREATE INDEX IF NOT EXISTS idx_releases_title ON releases(title);
                `);
                console.log('[DB] Schema verified/initialized');
            } catch (error) {
                console.error('[DB] Failed to initialize', error);
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    public async saveRelease(release: Release) {
        if (!this.db) await this.init();

        try {
            await this.db!.runAsync(
                'INSERT OR REPLACE INTO releases (id, userId, title, artist, thumb_url, added_at, year, genres, label, format, tracks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                release.id,
                release.userId,
                release.title,
                release.artist,
                release.thumb_url,
                release.added_at,
                release.year || null,
                release.genres || null,
                release.label || null,
                release.format || null,
                release.tracks || null
            );
        } catch (error) {
            console.error('[DB] Failed to save release', error);
            throw error;
        }
    }

    public async saveReleasesBatch(releases: Release[]) {
        if (!this.db) await this.init();

        try {
            await this.db!.withTransactionAsync(async () => {
                for (const release of releases) {
                    await this.db!.runAsync(
                        'INSERT OR REPLACE INTO releases (id, userId, title, artist, thumb_url, added_at, year, genres, label, format, tracks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        release.id,
                        release.userId,
                        release.title,
                        release.artist,
                        release.thumb_url,
                        release.added_at,
                        release.year || null,
                        release.genres || null,
                        release.label || null,
                        release.format || null,
                        release.tracks || null
                    );
                }
            });
        } catch (error) {
            console.error('[DB] Failed to batch save releases', error);
            throw error;
        }
    }

    public async getReleases(userId: string, limit = 50, offset = 0, searchQuery = ''): Promise<Release[]> {
        if (!this.db) await this.init();

        try {
            let query = 'SELECT * FROM releases WHERE userId = ?';
            const params: any[] = [userId];

            if (searchQuery) {
                query += ' AND (title LIKE ? OR artist LIKE ?)';
                const likeTerm = `%${searchQuery}%`;
                params.push(likeTerm, likeTerm);
            }

            query += ' ORDER BY added_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.db!.getAllAsync<Release>(query, params);
            return rows;
        } catch (error) {
            console.error('[DB] Failed to get releases', error);
            throw error;
        }
    }

    public async updateReleaseTracks(userId: string, releaseId: number, tracksJson: string) {
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'UPDATE releases SET tracks = ? WHERE id = ? AND userId = ?',
            tracksJson,
            releaseId,
            userId
        );
    }

    public async clearUserCollection(userId: string) {
        if (!this.db) await this.init();
        await this.db!.runAsync('DELETE FROM releases WHERE userId = ?', userId);
    }

    public async clearAll() {
        if (!this.db) await this.init();
        await this.db!.execAsync('DELETE FROM releases');
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
