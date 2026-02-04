import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NowPlaying, SyncStatus, ConnectionState } from '@/types';

interface SessionState {
    connectionState: ConnectionState;
    sessionId: string | null;
    nowPlaying: NowPlaying | null;
    username: string | null;
    avatarUrl: string | null;
    authToken: string | null;
    lastMode: 'host' | 'guest' | 'solo' | null;
    error: string | null;

    // Actions
    setConnectionState: (state: ConnectionState) => void;
    setSessionId: (id: string | null) => void;
    setNowPlaying: (track: NowPlaying | null) => void;
    setUsername: (username: string | null) => void;
    setAvatarUrl: (url: string | null) => void;
    setAuthToken: (token: string | null) => void;
    setLastMode: (mode: 'host' | 'guest' | 'solo' | null) => void;
    setError: (error: Error | string | null) => void;

    // Sync State
    syncStatus: SyncStatus;
    syncProgress: number | null;
    lastSyncTime: number | null;
    syncError: string | null;
    setSyncStatus: (status: SyncStatus) => void;
    setSyncProgress: (progress: number | null) => void;
    setLastSyncTime: (time: number) => void;
    setSyncError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            connectionState: 'disconnected',
            sessionId: null,
            nowPlaying: null,
            username: null,
            avatarUrl: null,
            authToken: null,
            lastMode: null,
            error: null,

            setConnectionState: (state) => set({ connectionState: state }),
            setSessionId: (id) => set({ sessionId: id }),
            setNowPlaying: (track) => set({ nowPlaying: track }),
            setUsername: (username) => set({ username }),
            setAvatarUrl: (url) => set({ avatarUrl: url }),
            setAuthToken: (token) => set({ authToken: token }),
            setLastMode: (mode) => set({ lastMode: mode }),
            setError: (error) => set({
                error: error instanceof Error ? error.message : error
            }),

            syncStatus: 'idle',
            syncProgress: null,
            lastSyncTime: null,
            syncError: null,
            setSyncStatus: (status) => set({ syncStatus: status }),
            setSyncProgress: (progress) => set({ syncProgress: progress }),
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
            setSyncError: (error) => set({ syncError: error }),
        }),
        {
            name: 'session-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                username: state.username,
                avatarUrl: state.avatarUrl,
                authToken: state.authToken,
                lastMode: state.lastMode,
                lastSyncTime: state.lastSyncTime
            }),
        }
    )
);
