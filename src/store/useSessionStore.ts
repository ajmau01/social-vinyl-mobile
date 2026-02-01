import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NowPlaying, SyncStatus } from '@/types';

interface SessionState {
    isConnected: boolean;
    isConnecting: boolean;
    activeSessionId: string | null;
    nowPlaying: NowPlaying | null;
    username: string | null;
    avatarUrl: string | null;
    authToken: string | null;
    lastMode: 'host' | 'guest' | 'solo' | null;

    // Actions
    setConnected: (status: boolean) => void;
    setConnecting: (status: boolean) => void;
    setSessionId: (id: string | null) => void;
    setNowPlaying: (track: NowPlaying | null) => void;
    setUsername: (username: string | null) => void;
    setAvatarUrl: (url: string | null) => void;
    setAuthToken: (token: string | null) => void;
    setLastMode: (mode: 'host' | 'guest' | 'solo' | null) => void;

    // Sync State
    syncStatus: SyncStatus;
    syncProgress: number | null;
    lastSyncTime: number | null;
    setSyncStatus: (status: SyncStatus) => void;
    setSyncProgress: (progress: number | null) => void;
    setLastSyncTime: (time: number) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            isConnected: false,
            isConnecting: false,
            activeSessionId: null,
            nowPlaying: null,
            username: 'solo_user', // DEFAULT: Initialized to solo_user for consistent scoping
            avatarUrl: null,
            authToken: null,
            lastMode: null,

            setConnected: (status) => set({ isConnected: status }),
            setConnecting: (status) => set({ isConnecting: status }),
            setSessionId: (id) => set({ activeSessionId: id }),
            setNowPlaying: (track) => set({ nowPlaying: track }),
            setUsername: (username) => set({ username }),
            setAvatarUrl: (url) => set({ avatarUrl: url }),
            setAuthToken: (token) => set({ authToken: token }),
            setLastMode: (mode) => set({ lastMode: mode }),

            syncStatus: 'idle',
            syncProgress: null,
            lastSyncTime: null,
            setSyncStatus: (status) => set({ syncStatus: status }),
            setSyncProgress: (progress) => set({ syncProgress: progress }),
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
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
