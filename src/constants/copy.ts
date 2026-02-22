/**
 * Canonical terminology map for Social Vinyl.
 * All user-facing strings should reference these constants — never hardcode brand vocabulary.
 *
 * Internal identifiers (store names, service names, type names, route paths, WebSocket message
 * types) are intentionally kept as-is (session, queue, etc.) for code stability.
 */
export const COPY = {
    TAGLINE: 'Where record collections come alive.',
    WELCOME_VALUE_PROP: 'Your crate, your room, your people.',
    INTENT_HOST: 'I have a collection',
    INTENT_SOLO: 'Explore collections',

    SUBTITLE_COLLECTOR: 'Connect your Discogs and host a party.',
    SUBTITLE_EXPLORE: "Browse public crates and see what's spinning.",

    HUB_AUTO_LOGGING: 'Welcome back...',
    HUB_HOST_TITLE: 'Collector Login',
    HUB_GUEST_TITLE: 'Enter Party Code',
    HUB_SOLO_TITLE: 'Explore collections',

    SESSION_NOUN: 'Listening Party',            // Title-case noun — "Start a Listening Party"
    SESSION_NOUN_SENTENCE: 'listening party',   // Sentence-case noun — use mid-sentence
    SESSION_NOUN_PLURAL: 'Listening Parties',
    ACTION_START_PARTY: 'Start Party',          // Short action label for buttons (horizontal layout)
    ACTION_JOIN_PARTY: 'Join Party',            // Short action label for buttons (horizontal layout)

    BIN_NOUN: 'Bin',                    // Forward-declared for #148 (Guest Collection View)
    RECORD_NOUN: 'Record',              // Forward-declared for #148
    BOOKMARK_VERB: 'Mark it',           // Forward-declared for #149 (Bookmark-to-Buy)
    BOOKMARK_NOUN: 'Want it',           // Forward-declared for #149
    SETLIST_NOUN: 'Setlist',            // Forward-declared for #154 (History & Setlist)

    // Issue #143: Account & Identity Model
    SIGN_IN: 'Sign In',
    CREATE_ACCOUNT: 'Create Account',
    DISPLAY_NAME: 'Display Name',
    WELCOME_BACK: 'Welcome Back',
} as const;

