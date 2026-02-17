import { NowPlaying } from '@/types';

/**
 * Normalizes a duration value to milliseconds.
 * 
 * Heuristic: If the value is less than 10,000, it is assumed to be in seconds
 * and specified in seconds, so it is multiplied by 1000.
 * Otherwise, it is assumed to be in milliseconds.
 * 
 * This heuristic works because no real album track is under 10 seconds (10,000ms).
 * 
 * @param duration - The duration value to normalize (can be undefined/null)
 * @returns The duration in milliseconds, or 0 if invalid
 */
export const normalizeDuration = (duration: number | undefined | null): number => {
    if (!duration) return 0;
    // If duration is suspiciously small (e.g. < 10000), it's likely seconds not ms.
    // 10000ms = 10s. We assume valid tracks are > 10s.
    return duration < 10000 ? duration * 1000 : duration;
};

/**
 * Normalizes the raw payload from WebSocket into a consistent NowPlaying object.
 * Handles variations in field names (e.g. album.title vs album, thumbCount vs likeCount).
 * 
 * @param raw - The raw payload from the WebSocket message
 * @returns A normalized NowPlaying object
 */
export const normalizeNowPlayingPayload = (raw: any): NowPlaying => {
    const duration = normalizeDuration(raw.duration || raw.album?.totalDuration);

    return {
        track: raw.album?.title || raw.track || '',
        artist: raw.album?.artist || raw.artist || '',
        album: raw.album?.title || raw.album || '',
        albumArt: raw.album?.coverImage || raw.albumArt || '',
        releaseId: (raw.album?.releaseId || raw.releaseId)?.toString() || '',
        timestamp: raw.playedAt || raw.timestamp,
        duration: duration,
        position: raw.position,
        userHasLiked: raw.userHasLiked,
        playedBy: raw.playedBy,
        likeCount: raw.thumbCount ?? raw.likeCount
    };
};
