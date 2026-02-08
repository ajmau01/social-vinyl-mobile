import { z } from 'zod';

/**
 * Zod schemas for runtime data validation.
 * Part of Security Hardening - Issue #73.
 */

/**
 * Schema for a single track in a release.
 */
export const TrackSchema = z.object({
    position: z.string().default('?').or(z.number().transform(n => n.toString())),
    title: z.string().min(1),
    duration: z.string().nullable().transform(val => val ?? '').default(''),
});

/**
 * Schema for a list of tracks.
 * Used when parsing tracks from the database or API.
 */
export const TrackListSchema = z.array(TrackSchema);

/**
 * Base schema for WebSocket messages to ensure minimal structure.
 */
export const WebSocketMessageSchema = z.object({
    type: z.string().min(1).optional(),
    messageType: z.string().min(1).optional(),
    action: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    sessionId: z.string().optional(),
    authToken: z.string().optional(),
    username: z.string().optional(),
    album: z.object({
        title: z.string(),
        artist: z.string(),
        coverImage: z.string(),
        releaseId: z.number().or(z.string().transform(v => parseInt(v))),
    }).optional(),
}).passthrough(); // Allow extra fields but ensure base structure

/**
 * Schema for Authentication response.
 */
export const AuthResponseSchema = z.object({
    type: z.enum(['admin-login-success', 'session-joined', 'error']),
    authToken: z.string().optional(),
    sessionId: z.string().optional(),
    username: z.string().optional(),
    message: z.string().optional(),
}).passthrough();
