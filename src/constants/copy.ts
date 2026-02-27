// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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

    // Issue #147: Guest Onboarding
    GUEST_JOIN_TITLE: 'Welcome to the Party!',
    GUEST_JOIN_SUBTITLE: 'Join the party to start picking records.',
    QUICK_JOIN: 'Quick Join',
    QUICK_JOIN_HINT: 'No account needed to join and browse.',
    JOIN_AS_GUEST: 'Join as Guest',
    CREATE_ACCOUNT_STUB_TITLE: 'Coming Soon',
    CREATE_ACCOUNT_STUB_DESC: 'Accounts will let you save your favorite records and follow hosts across parties.',
    USE_QUICK_JOIN: 'Use Quick Join Instead',

    // Issue #144 + #145: Session Mode Selector & Host Home Screen
    MODE_PARTY_TITLE: 'Listening Party',
    MODE_PARTY_DESC: "Invite friends with a QR code. Guests pick from your bin.",
    MODE_LIVE_TITLE: 'Go Live',
    MODE_LIVE_DESC: "Your turntable is public. Anyone can see what's spinning.",
    MODE_SOLO_TITLE: 'Just Play',
    MODE_SOLO_DESC: 'Private session. Just track what you play tonight.',
    CTA_START_PARTY: 'Start Party',
    CTA_GO_LIVE: 'Go Live',
    CTA_START_PLAYING: 'Start Playing',
    HOST_HOME_HISTORY_EMPTY: 'No sessions yet. Start your first listening party.',
    HOST_HOME_LAST_SESSION: 'Last session',
    HOST_HOME_SEE_ALL: 'See all history \u2192',
    HOST_HOME_START_SOMETHING: 'Start something',
    HOST_HOME_COLLECTION: 'Your Collection',
} as const;

