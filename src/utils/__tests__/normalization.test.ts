import { normalizeDuration } from '../normalization';

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
