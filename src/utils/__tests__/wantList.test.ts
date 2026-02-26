import { toggleWantList, buildShareText, shareWantList, getWantList } from '../wantList';
import { DatabaseService } from '@/services/DatabaseService';
import { Share } from 'react-native';
import { WantListItem, Release } from '@/types';

// Mock DatabaseService
jest.mock('@/services/DatabaseService', () => ({
    DatabaseService: {
        getInstance: jest.fn(),
    },
}));

// Mock react-native Share
jest.mock('react-native', () => ({
    Share: {
        share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
    },
}));

const makeRelease = (overrides: Partial<Release> = {}): Release => ({
    id: 42,
    userId: 'user1',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    thumb_url: 'http://example.com/img.jpg',
    added_at: 1000,
    ...overrides,
});

const makeWantListItem = (overrides: Partial<WantListItem> = {}): WantListItem => ({
    id: 'wl_1_abc',
    releaseId: 42,
    releaseTitle: 'Kind of Blue',
    artist: 'Miles Davis',
    albumArtUrl: 'http://example.com/img.jpg',
    hostUsername: 'hostuser',
    sessionName: 'Friday Night Party',
    sessionId: 'sess_123',
    addedAt: 1700000000000,
    ...overrides,
});

describe('wantList utils', () => {
    let mockDb: {
        isInWantList: jest.Mock;
        removeFromWantList: jest.Mock;
        addToWantList: jest.Mock;
        getWantList: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            isInWantList: jest.fn(),
            removeFromWantList: jest.fn().mockResolvedValue(undefined),
            addToWantList: jest.fn(),
            getWantList: jest.fn(),
        };

        (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDb);
    });

    describe('toggleWantList', () => {
        const ctx = {
            sessionId: 'sess_123',
            sessionName: 'Friday Night Party',
            hostUsername: 'hostuser',
        };

        it('returns true (added) when item is NOT already in list', async () => {
            mockDb.isInWantList.mockResolvedValue(false);
            mockDb.addToWantList.mockResolvedValue(makeWantListItem());

            const release = makeRelease();
            const result = await toggleWantList(release, ctx);

            expect(result).toBe(true);
            expect(mockDb.isInWantList).toHaveBeenCalledWith(42);
            expect(mockDb.addToWantList).toHaveBeenCalledWith(
                expect.objectContaining({
                    releaseId: 42,
                    releaseTitle: 'Kind of Blue',
                    artist: 'Miles Davis',
                    albumArtUrl: 'http://example.com/img.jpg',
                    hostUsername: 'hostuser',
                    sessionName: 'Friday Night Party',
                    sessionId: 'sess_123',
                })
            );
            expect(mockDb.removeFromWantList).not.toHaveBeenCalled();
        });

        it('returns false (removed) when item IS already in list', async () => {
            mockDb.isInWantList.mockResolvedValue(true);

            const release = makeRelease();
            const result = await toggleWantList(release, ctx);

            expect(result).toBe(false);
            expect(mockDb.isInWantList).toHaveBeenCalledWith(42);
            expect(mockDb.removeFromWantList).toHaveBeenCalledWith(42);
            expect(mockDb.addToWantList).not.toHaveBeenCalled();
        });

        it('uses null for thumb_url when it is null', async () => {
            mockDb.isInWantList.mockResolvedValue(false);
            mockDb.addToWantList.mockResolvedValue(makeWantListItem({ albumArtUrl: null }));

            const release = makeRelease({ thumb_url: null });
            await toggleWantList(release, ctx);

            expect(mockDb.addToWantList).toHaveBeenCalledWith(
                expect.objectContaining({ albumArtUrl: null })
            );
        });

        it('simulates add then remove for same release', async () => {
            const release = makeRelease();

            // First call: not in list — should add
            mockDb.isInWantList.mockResolvedValueOnce(false);
            mockDb.addToWantList.mockResolvedValueOnce(makeWantListItem());
            const firstResult = await toggleWantList(release, ctx);
            expect(firstResult).toBe(true);

            // Second call: now in list — should remove
            mockDb.isInWantList.mockResolvedValueOnce(true);
            const secondResult = await toggleWantList(release, ctx);
            expect(secondResult).toBe(false);

            expect(mockDb.addToWantList).toHaveBeenCalledTimes(1);
            expect(mockDb.removeFromWantList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getWantList', () => {
        it('delegates to DatabaseService.getWantList', async () => {
            const items = [makeWantListItem()];
            mockDb.getWantList.mockResolvedValue(items);

            const result = await getWantList();

            expect(result).toEqual(items);
            expect(mockDb.getWantList).toHaveBeenCalledTimes(1);
        });
    });

    describe('buildShareText', () => {
        it('returns header-only when items is empty', () => {
            const text = buildShareText([]);
            expect(text).toBe("Records I'm looking for:");
        });

        it('formats a single item with a known session correctly', () => {
            const item = makeWantListItem({
                hostUsername: 'djcool',
                sessionId: 'sess_1',
                sessionName: 'Cool Party',
                addedAt: new Date('2024-01-15').getTime(),
                artist: 'Miles Davis',
                releaseTitle: 'Kind of Blue',
            });

            const text = buildShareText([item]);

            expect(text).toContain("Records I'm looking for:");
            expect(text).toContain("djcool's");
            expect(text).toContain('party');
            expect(text).toContain('Jan 15');
            expect(text).toContain('• Miles Davis — Kind of Blue');
        });

        it('uses "a" for party label when hostUsername is null', () => {
            const item = makeWantListItem({
                hostUsername: null,
                sessionId: 'sess_1',
            });

            const text = buildShareText([item]);
            expect(text).toContain('— a party,');
        });

        it('groups items by sessionId', () => {
            const item1 = makeWantListItem({
                releaseId: 1,
                artist: 'Artist A',
                releaseTitle: 'Album A',
                sessionId: 'sess_1',
                hostUsername: 'host1',
                addedAt: new Date('2024-01-10').getTime(),
            });
            const item2 = makeWantListItem({
                releaseId: 2,
                artist: 'Artist B',
                releaseTitle: 'Album B',
                sessionId: 'sess_2',
                hostUsername: 'host2',
                addedAt: new Date('2024-02-20').getTime(),
            });
            const item3 = makeWantListItem({
                releaseId: 3,
                artist: 'Artist C',
                releaseTitle: 'Album C',
                sessionId: 'sess_1',
                hostUsername: 'host1',
                addedAt: new Date('2024-01-10').getTime(),
            });

            const text = buildShareText([item1, item2, item3]);

            // Both items from sess_1 should appear
            expect(text).toContain('• Artist A — Album A');
            expect(text).toContain('• Artist C — Album C');
            // Item from sess_2 should also appear
            expect(text).toContain('• Artist B — Album B');
        });

        it('uses "standalone" key for items with null sessionId', () => {
            const item = makeWantListItem({
                sessionId: null,
                hostUsername: null,
                addedAt: new Date('2024-03-05').getTime(),
                artist: 'Solo Artist',
                releaseTitle: 'Solo Album',
            });

            const text = buildShareText([item]);
            // standalone group still gets the "a party" label since hostUsername is null
            expect(text).toContain('— a party,');
            expect(text).toContain('• Solo Artist — Solo Album');
        });
    });

    describe('shareWantList', () => {
        it('calls Share.share with the formatted message', async () => {
            const items = [
                makeWantListItem({
                    artist: 'Miles Davis',
                    releaseTitle: 'Kind of Blue',
                    hostUsername: 'djcool',
                    sessionId: 'sess_1',
                    addedAt: new Date('2024-01-15').getTime(),
                }),
            ];

            await shareWantList(items);

            expect(Share.share).toHaveBeenCalledTimes(1);
            expect(Share.share).toHaveBeenCalledWith({
                message: expect.stringContaining('• Miles Davis — Kind of Blue'),
            });
        });

        it('does nothing when items array is empty', async () => {
            await shareWantList([]);

            expect(Share.share).not.toHaveBeenCalled();
        });
    });
});
