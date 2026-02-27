// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { dbService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockResolvedValue([]),
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
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('userId TEXT NOT NULL'));
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_releases_user'));
    });

    it('should save a release', async () => {
        await dbService.init();

        const release = {
            id: 123,
            instanceId: 456,
            userId: 'testuser',
            title: 'Test Album',
            artist: 'Test Artist',
            thumb_url: 'http://example.com/img.jpg',
            added_at: 1000
        };

        await dbService.saveRelease(release);

        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR REPLACE INTO releases'),
            123, 456, 'testuser', 'Test Album', 'Test Artist', 'http://example.com/img.jpg', 1000,
            null, null, null, null, null,
            456, 0, 456, 0, 456, 0, 0
        );
    });

    it('should save releases in batch', async () => {
        await dbService.init();

        const releases = [
            { id: 1, instanceId: 101, userId: 'u1', title: 'A', artist: 'A', thumb_url: 'u1', added_at: 100 },
            { id: 2, instanceId: 102, userId: 'u1', title: 'B', artist: 'B', thumb_url: 'u2', added_at: 200 }
        ];

        await dbService.saveReleasesBatch(releases);

        // Transaction should be called
        expect(mockDb.withTransactionAsync).toHaveBeenCalled();
        // Two inserts
        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });

    it('should get releases scoped by userId', async () => {
        await dbService.init();

        await dbService.getReleases('testuser', 10, 5);

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM releases WHERE userId = ?'),
            ['testuser', 10, 5]
        );
    });

    it('should clear the entire database in correct order', async () => {
        await dbService.init();
        await dbService.clearAll();

        // Verify all tables deleted
        expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM releases');
        expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM session_plays');
        expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM sessions');

        // Verify order: session_plays must be before sessions
        const calls = mockDb.execAsync.mock.calls.map((call: any) => call[0]);
        const playsIndex = calls.indexOf('DELETE FROM session_plays');
        const sessionsIndex = calls.indexOf('DELETE FROM sessions');

        expect(playsIndex).toBeGreaterThan(-1);
        expect(sessionsIndex).toBeGreaterThan(-1);
        expect(playsIndex).toBeLessThan(sessionsIndex);
    });

    it('should clear a specific user collection', async () => {
        await dbService.init();
        await dbService.clearUserCollection('testuser');
        expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM releases WHERE userId = ?', 'testuser');
    });

    it('should isolate data between users', async () => {
        await dbService.init();

        const user1Releases = [
            { id: 1, instanceId: 101, userId: 'user1', title: 'Album A', artist: 'Artist A', added_at: 100 }
        ];
        const user2Releases = [
            { id: 1, instanceId: 102, userId: 'user2', title: 'Album B', artist: 'Artist B', added_at: 200 }
        ];

        // Save for both users
        await dbService.saveReleasesBatch(user1Releases as any);
        await dbService.saveReleasesBatch(user2Releases as any);

        // Verify isolation
        mockDb.getAllAsync.mockResolvedValueOnce(user1Releases);
        const user1Data = await dbService.getReleases('user1', 50, 0);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('WHERE userId = ?'),
            ['user1', 50, 0]
        );
        expect(user1Data[0].title).toBe('Album A');

        mockDb.getAllAsync.mockResolvedValueOnce(user2Releases);
        const user2Data = await dbService.getReleases('user2', 50, 0);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('WHERE userId = ?'),
            ['user2', 50, 0]
        );
        expect(user2Data[0].title).toBe('Album B');
    });

    // --- History Tracking Tests ---

    it('should create a session record', async () => {
        await dbService.init();

        const session = {
            id: 'sess_123',
            session_name: 'Test Party',
            host_username: 'hostuser',
            started_at: 1000,
            ended_at: null,
            mode: 'party' as const,
            guest_count: 0
        };

        await dbService.createSession(session);

        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR IGNORE INTO sessions'),
            'sess_123', 'Test Party', 'hostuser', 1000, null, 'party', 0
        );
    });

    it('should end a session record', async () => {
        await dbService.init();

        await dbService.endSession('sess_123', 2000);

        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE sessions SET ended_at = ?'),
            2000, 'sess_123'
        );
    });

    it('should record a play', async () => {
        await dbService.init();

        const play = {
            id: 'play_1',
            session_id: 'sess_123',
            release_id: 10,
            release_title: 'Album',
            artist: 'Artist',
            album_art_url: 'http://img.jpg',
            played_at: 1500,
            picked_by_username: 'guest1'
        };

        await dbService.recordPlay(play);

        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR IGNORE INTO session_plays'),
            'play_1', 'sess_123', 10, 'Album', 'Artist', 'http://img.jpg', 1500, 'guest1'
        );
    });

    it('should get session history', async () => {
        await dbService.init();

        await dbService.getSessionsHistory(20, 0);

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?'),
            expect.arrayContaining([20, 0])
        );
    });

    it('should get session setlist', async () => {
        await dbService.init();

        await dbService.getSessionSetlist('sess_123');

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM session_plays WHERE session_id = ? ORDER BY played_at ASC'),
            ['sess_123']
        );
    });
});
