import * as SQLite from 'expo-sqlite';

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
}

class DatabaseService {
    private static instance: DatabaseService;
    private db: SQLite.SQLiteDatabase | null = null;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async init() {
        if (this.db) return;

        try {
            console.log('[DB] Initializing SQLite...');
            this.db = await SQLite.openDatabaseAsync('social_vinyl.db');

            // WARN: Destructive schema update for Phase 2.5
            // Dropping table to ensure clean schema with new columns.
            await this.db.execAsync('DROP TABLE IF EXISTS releases');
            console.warn('[DB] Schema upgrade: Dropped releases table (Data Loss Expected for Dev)');

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS releases (
                    id INTEGER PRIMARY KEY NOT NULL,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    thumb_url TEXT,
                    added_at INTEGER NOT NULL,
                    year TEXT,
                    genres TEXT,
                    label TEXT,
                    format TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_releases_added_at ON releases(added_at);
                CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist);
                CREATE INDEX IF NOT EXISTS idx_releases_title ON releases(title);
                CREATE INDEX IF NOT EXISTS idx_releases_year ON releases(year);
                CREATE INDEX IF NOT EXISTS idx_releases_genres ON releases(genres);
            `);
            console.log('[DB] Initialized successfully');
        } catch (error) {
            console.error('[DB] Failed to initialize', error);
            throw error;
        }
    }

    public async saveRelease(release: Release) {
        if (!this.db) await this.init();

        try {
            await this.db!.runAsync(
                'INSERT OR REPLACE INTO releases (id, title, artist, thumb_url, added_at, year, genres, label, format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                release.id,
                release.title,
                release.artist,
                release.thumb_url,
                release.added_at,
                release.year || null,
                release.genres || null,
                release.label || null,
                release.format || null
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
                        'INSERT OR REPLACE INTO releases (id, title, artist, thumb_url, added_at, year, genres, label, format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        release.id,
                        release.title,
                        release.artist,
                        release.thumb_url,
                        release.added_at,
                        release.year || null,
                        release.genres || null,
                        release.label || null,
                        release.format || null
                    );
                }
            });
        } catch (error) {
            console.error('[DB] Failed to batch save releases', error);
            throw error;
        }
    }

    public async getReleases(limit = 50, offset = 0, searchQuery = ''): Promise<Release[]> {
        if (!this.db) await this.init();

        try {
            let query = 'SELECT * FROM releases';
            const params: any[] = [];

            if (searchQuery) {
                query += ' WHERE title LIKE ? OR artist LIKE ?';
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

    public async clear() {
        if (!this.db) await this.init();
        await this.db!.execAsync('DELETE FROM releases');
    }

    // Only for testing
    public _resetForTesting() {
        this.db = null;
        // @ts-ignore - clearing singleton for test isolation
        DatabaseService.instance = null;
    }
}

export const dbService = DatabaseService.getInstance();
