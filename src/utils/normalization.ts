import { NowPlaying } from '@/types';

/**
 * Normalizes a duration/position value to milliseconds.
 *
 * Heuristic: If the value is less than 10,000, it is assumed to be in seconds
 * and multiplied by 1000. Otherwise it is assumed to already be in milliseconds.
 *
 * This heuristic works because no real album track or playback position in normal
 * use is under 10 seconds (10,000 ms).
 *
 * @param value - The value to normalize (can be undefined/null)
 * @returns The value in milliseconds, or 0 if invalid
 */
export const normalizeDuration = (value: number | undefined | null): number => {
    if (!value) return 0;
    return value < 10000 ? value * 1000 : value;
};

/**
 * Normalizes the raw payload from WebSocket into a consistent NowPlaying object.
 * Handles variations in field names (e.g. album.title vs album, thumbCount vs likeCount).
 *
 * Pass `existingNowPlaying` to enable playedAt preservation: the webapp carries
 * forward the original start timestamp when the backend omits it on subsequent
 * position-update broadcasts for the same track.
 *
 * @param raw - The raw payload from the WebSocket message
 * @param existingNowPlaying - Current NowPlaying state (for playedAt preservation)
 * @returns A normalized NowPlaying object
 */
export const normalizeNowPlayingPayload = (raw: any, existingNowPlaying?: NowPlaying | null): NowPlaying => {
    const duration = normalizeDuration(raw.duration || raw.album?.totalDuration);
    const position = normalizeDuration(raw.position); // same seconds/ms heuristic as duration

    // Preserve playedAt from the previous state when the backend sends 0/null for
    // the same track (mirrors the webapp's currentNpPlayedAt preservation logic).
    const incomingPlayedAt = raw.playedAt || raw.timestamp;
    const trackTitle = raw.album?.title || raw.track || '';
    const preservedPlayedAt =
        !incomingPlayedAt && existingNowPlaying?.playedAt && existingNowPlaying.track === trackTitle
            ? existingNowPlaying.playedAt
            : incomingPlayedAt;

    return {
        track: trackTitle,
        artist: raw.album?.artist || raw.artist || '',
        album: raw.album?.title || raw.album || '',
        albumArt: raw.album?.coverImage || raw.albumArt || '',
        releaseId: (raw.album?.releaseId || raw.releaseId)?.toString() || '',
        timestamp: incomingPlayedAt,
        playedAt: preservedPlayedAt,
        duration,
        position,
        userHasLiked: raw.userHasLiked,
        playedBy: raw.playedBy,
        likeCount: raw.thumbCount ?? raw.likeCount
    };
};
