// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

/**
 * WebSocket action name constants.
 * Must match the Java WebSocketAction enum on the backend.
 * Using this object instead of string literals prevents contract drift.
 */
export const WS_ACTIONS = {
    ADD:           'add',
    REMOVE:        'remove',
    REORDER:       'reorder',
    CLEAR:         'clear',
    PLAY_ALBUM:    'play-album',
    STOP_PLAYBACK: 'stop-playback',
    ARCHIVE:       'archive-session',
    LIKE:          'like-album',
    UNLIKE:        'unlike-album',
} as const;

export type WsAction = typeof WS_ACTIONS[keyof typeof WS_ACTIONS];
