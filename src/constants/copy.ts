/**
 * Canonical terminology map for Social Vinyl.
 * All user-facing strings should reference these constants — never hardcode brand vocabulary.
 *
 * Internal identifiers (store names, service names, type names, route paths, WebSocket message
 * types) are intentionally kept as-is (session, queue, etc.) for code stability.
 */
export const COPY = {
    SESSION_NOUN: 'Listening Party',            // Title-case noun — "Start a Listening Party"
    SESSION_NOUN_SENTENCE: 'listening party',   // Sentence-case noun — use mid-sentence
    SESSION_NOUN_PLURAL: 'Listening Parties',

    BIN_NOUN: 'Bin',                    // Forward-declared for #148 (Guest Collection View)
    RECORD_NOUN: 'Record',              // Forward-declared for #148
    BOOKMARK_VERB: 'Mark it',           // Forward-declared for #149 (Bookmark-to-Buy)
    BOOKMARK_NOUN: 'Want it',           // Forward-declared for #149
    SETLIST_NOUN: 'Setlist',            // Forward-declared for #154 (History & Setlist)
} as const;

