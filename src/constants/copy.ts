/**
 * Canonical terminology map for Social Vinyl.
 * All user-facing strings should reference these constants — never hardcode brand vocabulary.
 *
 * Internal identifiers (store names, service names, type names, route paths, WebSocket message
 * types) are intentionally kept as-is (session, queue, etc.) for code stability.
 */
export const COPY = {
    SESSION_NOUN: 'Listening Party',
    SESSION_NOUN_PLURAL: 'Listening Parties',
    BIN_NOUN: 'Bin',
    RECORD_NOUN: 'Record',
    BOOKMARK_VERB: 'Mark it',
    BOOKMARK_NOUN: 'Want it',
    SETLIST_NOUN: 'Setlist',
} as const;
