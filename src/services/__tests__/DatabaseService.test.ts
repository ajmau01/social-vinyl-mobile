import { dbService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn(),
        withTransactionAsync: jest.fn(async (cb) => await cb()),
    }),
}));

describe('DatabaseService', () => {
    let mockDb: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        // Reset singleton logic using new method
        dbService._resetForTesting();

        // Get the mock DB object
        mockDb = await (SQLite.openDatabaseAsync as jest.Mock)();
    });

    it('should initialize the database with indexes', async () => {
        await dbService.init();

        expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('social_vinyl.db');
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS releases'));
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_releases_added_at'));
    });

    it('should save a release', async () => {
        await dbService.init();

        const release = {
            id: 123,
            title: 'Test Album',
            artist: 'Test Artist',
            thumb_url: 'http://example.com/img.jpg',
            added_at: 1000
        };

        await dbService.saveRelease(release);

        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR REPLACE INTO releases'),
            123, 'Test Album', 'Test Artist', 'http://example.com/img.jpg', 1000,
            null, null, null, null, null
        );
    });

    it('should save releases in batch', async () => {
        await dbService.init();

        const releases = [
            { id: 1, title: 'A', artist: 'A', thumb_url: 'u1', added_at: 100 },
            { id: 2, title: 'B', artist: 'B', thumb_url: 'u2', added_at: 200 }
        ];

        await dbService.saveReleasesBatch(releases);

        // Transaction should be called
        expect(mockDb.withTransactionAsync).toHaveBeenCalled();
        // Two inserts
        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });

    it('should get releases with pagination', async () => {
        await dbService.init();

        await dbService.getReleases(10, 5);

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM releases'),
            [10, 5]
        );
    });

    it('should clear the database', async () => {
        await dbService.init();
        await dbService.clear();
        expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM releases');
    });
});
