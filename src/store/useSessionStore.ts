import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NowPlaying {
    title: string;
    artist: string;
    releaseId: string;
    coverInfo?: {
        pixelUri?: string; // Placeholder or low-res
    };
}

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
    syncStatus: 'idle' | 'syncing' | 'error' | 'success';
    syncProgress: number | null;
    lastSyncTime: number | null;
    setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'success') => void;
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
            username: null,
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
