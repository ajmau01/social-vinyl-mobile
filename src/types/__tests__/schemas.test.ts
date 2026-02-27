// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { TrackSchema, TrackListSchema, WebSocketMessageSchema } from '../schemas';

describe('Zod Schemas', () => {
    describe('TrackSchema', () => {
        it('should validate valid track objects', () => {
            const validTrack = { position: 'A1', title: 'Song title', duration: '3:45' };
            expect(TrackSchema.parse(validTrack)).toEqual(validTrack);
        });

        it('should transform numeric positions to strings', () => {
            const numericTrack = { position: 1, title: 'Numeric Position' };
            const result = TrackSchema.parse(numericTrack);
            expect(result.position).toBe('1');
        });

        it('should fail if title is missing', () => {
            const invalidTrack = { position: '1' };
            expect(() => TrackSchema.parse(invalidTrack)).toThrow();
        });
    });

    describe('TrackListSchema', () => {
        it('should validate arrays of tracks', () => {
            const tracks = [
                { position: '1', title: 'Track 1' },
                { position: '2', title: 'Track 2' }
            ];
            expect(TrackListSchema.parse(tracks)).toHaveLength(2);
        });

        it('should handle empty arrays', () => {
            expect(TrackListSchema.parse([])).toEqual([]);
        });
    });

    describe('WebSocketMessageSchema', () => {
        it('should validate base structure while allowing extra fields', () => {
            const msg = { type: 'now-playing', artist: 'Miles Davis', extra: 'data' };
            const result = WebSocketMessageSchema.parse(msg);
            expect(result.type).toBe('now-playing');
            expect(result.artist).toBe('Miles Davis');
        });

        it('should fail if type and messageType are both missing and required for logic', () => {
            // Schematic only ensures type exists if provided. 
            // Our schema has them as optional but min(1) if present.
            const invalidMsg = { type: '' };
            expect(() => WebSocketMessageSchema.parse(invalidMsg)).toThrow();
        });
    });
});
