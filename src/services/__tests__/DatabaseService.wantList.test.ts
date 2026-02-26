import { dbService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
        withTransactionAsync: jest.fn(async (cb) => await cb()),
    }),
}));

describe('DatabaseService - Want List', () => {
    let mockDb: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        dbService._resetForTesting();

        mockDb = await (SQLite.openDatabaseAsync as jest.Mock)();
    });

    describe('addToWantList', () => {
        it('adds item and returns it with a generated id', async () => {
            await dbService.init();

            const item = {
                releaseId: 42,
                releaseTitle: 'Kind of Blue',
                artist: 'Miles Davis',
                albumArtUrl: 'http://example.com/img.jpg',
                hostUsername: 'hostuser',
                sessionName: 'Friday Night Party',
                sessionId: 'sess_123',
                addedAt: 1700000000000,
            };

            const result = await dbService.addToWantList(item);

            // Should have generated an id
            expect(result.id).toMatch(/^wl_\d+_[a-z0-9]+$/);
            // Should spread all item fields
            expect(result.releaseId).toBe(42);
            expect(result.releaseTitle).toBe('Kind of Blue');
            expect(result.artist).toBe('Miles Davis');
            expect(result.albumArtUrl).toBe('http://example.com/img.jpg');
            expect(result.hostUsername).toBe('hostuser');
            expect(result.sessionName).toBe('Friday Night Party');
            expect(result.sessionId).toBe('sess_123');
            expect(result.addedAt).toBe(1700000000000);

            // Should have called runAsync with the correct SQL
            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR REPLACE INTO want_list'),
                expect.arrayContaining([
                    result.id,
                    42,
                    'Kind of Blue',
                    'Miles Davis',
                    'http://example.com/img.jpg',
                    'hostuser',
                    'Friday Night Party',
                    'sess_123',
                    1700000000000,
                ])
            );
        });

        it('coerces null albumArtUrl to null in DB call', async () => {
            await dbService.init();

            const item = {
                releaseId: 99,
                releaseTitle: 'No Art Album',
                artist: 'Unknown Artist',
                albumArtUrl: null,
                hostUsername: null,
                sessionName: null,
                sessionId: null,
                addedAt: 1700000001000,
            };

            const result = await dbService.addToWantList(item);
            expect(result.albumArtUrl).toBeNull();
            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR REPLACE INTO want_list'),
                expect.arrayContaining([null, null, null, null])
            );
        });
    });

    describe('removeFromWantList', () => {
        it('calls DELETE with the correct releaseId', async () => {
            await dbService.init();

            await dbService.removeFromWantList(42);

            expect(mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM want_list WHERE release_id = ?',
                [42]
            );
        });
    });

    describe('isInWantList', () => {
        it('returns true when count > 0', async () => {
            await dbService.init();

            mockDb.getFirstAsync.mockResolvedValueOnce({ count: 1 });
            const result = await dbService.isInWantList(42);

            expect(result).toBe(true);
            expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
                'SELECT COUNT(*) as count FROM want_list WHERE release_id = ?',
                [42]
            );
        });

        it('returns false when count is 0', async () => {
            await dbService.init();

            mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });
            const result = await dbService.isInWantList(99);

            expect(result).toBe(false);
        });

        it('returns false when getFirstAsync returns null', async () => {
            await dbService.init();

            mockDb.getFirstAsync.mockResolvedValueOnce(null);
            const result = await dbService.isInWantList(77);

            expect(result).toBe(false);
        });
    });

    describe('getWantList', () => {
        it('returns items mapped from snake_case rows, ordered by added_at DESC', async () => {
            await dbService.init();

            const rows = [
                {
                    id: 'wl_2000_abc',
                    release_id: 42,
                    release_title: 'Kind of Blue',
                    artist: 'Miles Davis',
                    album_art_url: 'http://example.com/img.jpg',
                    host_username: 'hostuser',
                    session_name: 'Friday Night',
                    session_id: 'sess_123',
                    added_at: 2000,
                },
                {
                    id: 'wl_1000_xyz',
                    release_id: 7,
                    release_title: 'Bitches Brew',
                    artist: 'Miles Davis',
                    album_art_url: null,
                    host_username: null,
                    session_name: null,
                    session_id: null,
                    added_at: 1000,
                },
            ];

            mockDb.getAllAsync.mockResolvedValueOnce(rows);

            const result = await dbService.getWantList();

            expect(result).toHaveLength(2);

            // First item (most recent)
            expect(result[0].id).toBe('wl_2000_abc');
            expect(result[0].releaseId).toBe(42);
            expect(result[0].releaseTitle).toBe('Kind of Blue');
            expect(result[0].artist).toBe('Miles Davis');
            expect(result[0].albumArtUrl).toBe('http://example.com/img.jpg');
            expect(result[0].hostUsername).toBe('hostuser');
            expect(result[0].sessionName).toBe('Friday Night');
            expect(result[0].sessionId).toBe('sess_123');
            expect(result[0].addedAt).toBe(2000);

            // Second item
            expect(result[1].id).toBe('wl_1000_xyz');
            expect(result[1].releaseId).toBe(7);
            expect(result[1].albumArtUrl).toBeNull();
            expect(result[1].hostUsername).toBeNull();
            expect(result[1].sessionName).toBeNull();
            expect(result[1].sessionId).toBeNull();

            expect(mockDb.getAllAsync).toHaveBeenCalledWith(
                'SELECT * FROM want_list ORDER BY added_at DESC'
            );
        });

        it('returns empty array when no items exist', async () => {
            await dbService.init();

            mockDb.getAllAsync.mockResolvedValueOnce([]);
            const result = await dbService.getWantList();

            expect(result).toEqual([]);
        });
    });
});
