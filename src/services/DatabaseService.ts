import * as SQLite from 'expo-sqlite';

export interface Release {
    id: number;
    title: string;
    artist: string;
    thumb_url: string | null;
    added_at: number;
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

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS releases (
                    id INTEGER PRIMARY KEY NOT NULL,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    thumb_url TEXT,
                    added_at INTEGER NOT NULL
                );
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
                'INSERT OR REPLACE INTO releases (id, title, artist, thumb_url, added_at) VALUES (?, ?, ?, ?, ?)',
                release.id,
                release.title,
                release.artist,
                release.thumb_url,
                release.added_at
            );
        } catch (error) {
            console.error('[DB] Failed to save release', error);
            throw error;
        }
    }

    public async getReleases(limit = 50, offset = 0): Promise<Release[]> {
        if (!this.db) await this.init();

        try {
            const rows = await this.db!.getAllAsync<Release>(
                'SELECT * FROM releases ORDER BY added_at DESC LIMIT ? OFFSET ?',
                limit, offset
            );
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
}

export const dbService = DatabaseService.getInstance();
