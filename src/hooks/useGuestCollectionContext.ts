// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { DatabaseService } from '@/services/DatabaseService';

export interface GuestCollectionContext {
    isGuest: boolean;
    isInSession: boolean;
    binItemCount: number;
    isReleaseInBin: (releaseId: number) => boolean;
    isReleasePlayed: (releaseId: number) => boolean;
    sessionName: string | null;
    hostUsername: string | null;
    sessionId: string | null;
}

export function useGuestCollectionContext(): GuestCollectionContext {
    const { sessionId, sessionRole, sessionName, hostUsername } = useSessionStore(
        useShallow(state => ({
            sessionId: state.sessionId,
            sessionRole: state.sessionRole,
            sessionName: state.sessionName,
            hostUsername: state.hostUsername,
        }))
    );
    const binItems = useListeningBinStore(state => state.items);
    const [playedIds, setPlayedIds] = useState<Set<number>>(new Set());

    const sessionIdStr = sessionId !== null ? String(sessionId) : null;

    useEffect(() => {
        if (!sessionIdStr) { setPlayedIds(new Set()); return; }
        DatabaseService.getInstance()
            .getSessionSetlist(sessionIdStr)
            .then(plays => setPlayedIds(new Set(plays.map(p => p.release_id))))
            .catch(() => setPlayedIds(new Set()));
    }, [sessionIdStr]);

    const isReleaseInBin = useCallback(
        (releaseId: number) => binItems.some(item => item.id === releaseId || item.releaseId === releaseId),
        [binItems]
    );
    const isReleasePlayed = useCallback(
        (releaseId: number) => playedIds.has(releaseId),
        [playedIds]
    );

    return {
        isGuest: sessionRole === 'guest',
        isInSession: !!sessionIdStr && sessionRole !== null,
        binItemCount: binItems.length,
        isReleaseInBin,
        isReleasePlayed,
        sessionName: sessionName ?? null,
        hostUsername: hostUsername ?? null,
        sessionId: sessionIdStr,
    };
}
