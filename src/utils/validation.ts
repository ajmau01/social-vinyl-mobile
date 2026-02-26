/**
 * Validation utilities for user input and data sanitization.
 * Part of Security Hardening - Issue #70.
 */

/**
 * Validates a Discogs username.
 * Rules: 3-30 characters, alphanumeric, underscores, or hyphens.
 */
export const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
};

/**
 * Validates a Party Join Code.
 * Rules: Exactly 5 characters, alphanumeric.
 */
export const validatePartyCode = (code: string): boolean => {
    const codeRegex = /^[a-zA-Z0-9]{5}$/;
    return codeRegex.test(code);
};

/**
 * Sanitizes a search query.
 * Limits length to 100 characters and removes non-printable characters.
 */
export const sanitizeSearchQuery = (query: string): string => {
    if (!query) return '';
    // Limit length
    let sanitized = query.slice(0, 100);
    // Remove non-printable characters
    sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
    return sanitized;
};

/**
 * Sanitizes a display name for guest join.
 * Strips HTML-sensitive characters (<, >, &) and limits to 20 chars.
 */
export const sanitizeDisplayName = (name: string): string => {
    if (!name) return '';
    // Replace & with and for better UX
    let sanitized = name.replace(/&/g, 'and');
    // Strip HTML characters and non-printable chars
    sanitized = sanitized.replace(/[<>]/g, '');
    sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
    // Trim and then slice to ensure 20 chars of content
    return sanitized.trim().slice(0, 20);
};
