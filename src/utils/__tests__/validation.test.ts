import { validateUsername, validatePartyCode, sanitizeSearchQuery } from '../validation';

describe('Validation Utilities', () => {
    describe('validateUsername', () => {
        it('should accept valid Discogs usernames', () => {
            expect(validateUsername('ajmau01')).toBe(true);
            expect(validateUsername('test_user')).toBe(true);
            expect(validateUsername('user-name')).toBe(true);
            expect(validateUsername('123abc_')).toBe(true);
        });

        it('should reject usernames that are too short', () => {
            expect(validateUsername('aj')).toBe(false);
            expect(validateUsername('')).toBe(false);
        });

        it('should reject usernames that are too long', () => {
            expect(validateUsername('a'.repeat(31))).toBe(false);
        });

        it('should reject usernames with invalid characters', () => {
            expect(validateUsername('ajmau!@#')).toBe(false);
            expect(validateUsername('user space')).toBe(false);
            expect(validateUsername('user.name')).toBe(false);
        });
    });

    describe('validatePartyCode', () => {
        it('should accept valid 5-character alphanumeric codes', () => {
            expect(validatePartyCode('ABCDE')).toBe(true);
            expect(validatePartyCode('12345')).toBe(true);
            expect(validatePartyCode('a1b2c')).toBe(true);
        });

        it('should reject codes catch-less than 5 characters', () => {
            expect(validatePartyCode('ABCD')).toBe(false);
            expect(validatePartyCode('')).toBe(false);
        });

        it('should reject codes longer than 5 characters', () => {
            expect(validatePartyCode('ABCDEF')).toBe(false);
        });

        it('should reject codes with special characters', () => {
            expect(validatePartyCode('ABC!1')).toBe(false);
            expect(validatePartyCode('A B C')).toBe(false);
        });
    });

    describe('sanitizeSearchQuery', () => {
        it('should truncate queries longer than 100 characters', () => {
            const longQuery = 'a'.repeat(150);
            expect(sanitizeSearchQuery(longQuery)).toHaveLength(100);
        });

        it('should remove non-printable characters', () => {
            const dirtyQuery = 'Rock\nRoll\u0000!';
            expect(sanitizeSearchQuery(dirtyQuery)).toBe('RockRoll!');
        });

        it('should return empty string for null/undefined/empty input', () => {
            expect(sanitizeSearchQuery('')).toBe('');
            // @ts-ignore
            expect(sanitizeSearchQuery(null)).toBe('');
        });
    });
});
