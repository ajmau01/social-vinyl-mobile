import { dbService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn(),
    }),
}));

describe('DatabaseService', () => {
    let mockDb: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        // Reset singleton instance logic if possible, 
        // or just rely on re-initializing mock behavior

        // Get the mock DB object that openDatabaseAsync returns
        mockDb = await (SQLite.openDatabaseAsync as jest.Mock)();
    });

    it('should initialize the database and create table', async () => {
        await dbService.init();

        expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('social_vinyl.db');
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS releases'));
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
            123, 'Test Album', 'Test Artist', 'http://example.com/img.jpg', 1000
        );
    });

    it('should get releases with pagination', async () => {
        await dbService.init();

        await dbService.getReleases(10, 5);

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM releases'),
            10, 5
        );
    });
});
