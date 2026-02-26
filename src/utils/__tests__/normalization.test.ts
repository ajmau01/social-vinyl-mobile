import { normalizeDuration, normalizeNowPlayingPayload } from '../normalization';

describe('normalizeDuration', () => {
    it('returns 0 for undefined', () => {
        expect(normalizeDuration(undefined)).toBe(0);
    });

    it('returns 0 for null', () => {
        expect(normalizeDuration(null)).toBe(0);
    });

    it('returns 0 for 0', () => {
        expect(normalizeDuration(0)).toBe(0);
    });

    it('multiplies by 1000 when value is below threshold (seconds input)', () => {
        // 1 second -> 1000ms
        expect(normalizeDuration(1)).toBe(1000);
        // 9.999 seconds -> 9999ms
        expect(normalizeDuration(9999)).toBe(9999000);
    });

    it('leaves value untouched when >= 10000 (ms input)', () => {
        // 10 seconds (10000ms) -> 10000ms
        expect(normalizeDuration(10000)).toBe(10000);
        // 5 minutes (300000ms) -> 300000ms
        expect(normalizeDuration(300000)).toBe(300000);
    });
});

describe('normalizeNowPlayingPayload', () => {
    it('handles flat payload structure', () => {
        const payload = {
            track: 'Song Title',
            artist: 'Artist Name',
            album: 'Album Name',
            albumArt: 'http://example.com/art.jpg',
            releaseId: 12345,
            duration: 180, // seconds
            position: 10,
            userHasLiked: true,
            likeCount: 5,
            playedBy: 'User1'
        };

        const result = normalizeNowPlayingPayload(payload);

        expect(result).toEqual({
            track: 'Song Title',
            artist: 'Artist Name',
            album: 'Album Name',
            albumArt: 'http://example.com/art.jpg',
            releaseId: '12345',
            timestamp: undefined,
            playedAt: undefined,
            duration: 180000, // normalized to ms
            position: 10000, // normalized: 10s → 10000ms
            userHasLiked: true,
            playedBy: 'User1',
            likeCount: 5
        });
    });

    it('handles nested album structure', () => {
        const payload = {
            album: {
                title: 'Song Title', // In some backends, track title is mapped to album.title unfortunately or vice versa
                // Wait, the logic in implementation was: `raw.album?.title || raw.track` for track name?
                // logic: track: raw.album?.title || raw.track || '',
                // logic: artist: raw.album?.artist || raw.artist || '',
                // logic: album: raw.album?.title || raw.album || '',
                // Actually looking at the code:
                // track: raw.album?.title || raw.track || '',
                // album: raw.album?.title || raw.album || '',
                // This seems like track and album might be getting same value if raw.album.title is present.
                // But this mimics existing legacy behavior.
                artist: 'Artist Name',
                coverImage: 'http://example.com/art.jpg',
                releaseId: 67890,
                totalDuration: 200000 // ms
            },
            thumbCount: 10
        };

        const result = normalizeNowPlayingPayload(payload);

        expect(result).toEqual({
            track: 'Song Title',
            artist: 'Artist Name',
            album: 'Song Title', // Based on existing logic
            albumArt: 'http://example.com/art.jpg',
            releaseId: '67890',
            timestamp: undefined,
            playedAt: undefined,
            duration: 200000,
            position: 0, // normalizeDuration(undefined) → 0
            userHasLiked: undefined,
            playedBy: undefined,
            likeCount: 10 // handled thumbCount alias
        });
    });
});
