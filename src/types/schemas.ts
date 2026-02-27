// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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
 * Helper to handle IDs that can be either strings or numbers,
 * normalizing them to strings.
 */
const IdSchema = z.union([z.string(), z.number().transform(n => n.toString())]);

/**
 * Base schema for WebSocket messages to ensure minimal structure.
 */
export const WebSocketMessageSchema = z.object({
    type: z.string().min(1).optional(),
    messageType: z.string().min(1).optional(),
    action: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    // Issue #125 types
    actionId: z.string().optional(),
    status: z.enum(['success', 'error']).optional(),
    sessionId: IdSchema.optional(),
    authToken: z.string().optional(),
    username: z.string().optional(),
    album: z.object({
        title: z.string(),
        artist: z.string(),
        coverImage: z.string(),
        releaseId: IdSchema,
    }).optional(),
    playedAt: z.number().optional(),
    duration: z.number().optional(),
    position: z.number().optional(),
    likeCount: z.number().optional(),
    userHasLiked: z.boolean().optional(),
    playedBy: z.string().optional(),
}).passthrough(); // Allow extra fields but ensure base structure

/**
 * Schema for Authentication response.
 * Broadened to allow ignoring non-auth messages on the login socket.
 */
export const AuthResponseSchema = z.object({
    type: z.string(), // Relaxed to allow all intermediate handshake messages (access-level, state, etc)
    authToken: z.string().optional(),
    sessionId: IdSchema.optional(),
    username: z.string().optional(),
    message: z.string().optional(),
}).passthrough();

/**
 * Schema for Protocol Handshake (Client -> Server)
 * Issue #125
 */
export const ProtocolHandshakeSchema = z.object({
    type: z.literal('PROTOCOL_HANDSHAKE'),
    version: z.string(),
    capabilities: z.array(z.string()),
});

/**
 * Schema for Protocol ACK (Server -> Client)
 * Issue #125
 */
export const ProtocolAckSchema = z.object({
    type: z.literal('PROTOCOL_ACK'),
    supported: z.boolean(),
    enabledFeatures: z.array(z.string()),
});

/**
 * Schema for Client Action (Client -> Server)
 * Issue #125
 */
export const ClientActionSchema = z.object({
    type: z.literal('CLIENT_ACTION'),
    action: z.string().min(1),
    actionId: z.string().uuid(),
    payload: z.any().optional(),
});

/**
 * Schema for Action ACK (Server -> Client)
 * Issue #125
 */
export const ActionAckSchema = z.object({
    type: z.literal('ACTION_ACK'),
    actionId: z.string().uuid(),
    status: z.enum(['success', 'error']),
    data: z.any().optional(),
});

/**
 * Session Management Schemas (Issue #128)
 */
export const SessionCardSchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().length(5),
    active: z.boolean(),
    permanent: z.boolean(),
    isBroadcast: z.boolean(),
    createdAt: z.string()
});

export const SessionCreatedSchema = z.object({
    type: z.literal('session-created'),
    sessionId: z.number(),
    joinCode: z.string().length(5),
    sessionSecret: z.string(),
    name: z.string(),
    publicUrl: z.string()
});

export const SessionJoinedSchema = z.object({
    type: z.literal('session-joined'),
    sessionId: z.number(),
    name: z.string(),
    joinCode: z.string().length(5),
    sessionSecret: z.string(),
    publicUrl: z.string(),
    hostUsername: z.string(),
    isPermanent: z.boolean(),
    startedAt: z.number().optional()
});

export const SessionLeftSchema = z.object({
    type: z.literal('session-left')
});

export const SessionListSchema = z.object({
    type: z.literal('session-list'),
    sessions: z.array(SessionCardSchema)
});
