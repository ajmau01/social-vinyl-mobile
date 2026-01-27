import { create } from 'zustand';

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

    // Actions
    setConnected: (status: boolean) => void;
    setConnecting: (status: boolean) => void;
    setSessionId: (id: string | null) => void;
    setNowPlaying: (track: NowPlaying | null) => void;

    // Sync State
    syncStatus: 'idle' | 'syncing' | 'error' | 'success';
    syncProgress: number | null;
    lastSyncTime: number | null;
    setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'success') => void;
    setSyncProgress: (progress: number | null) => void;
    setLastSyncTime: (time: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    isConnected: false,
    isConnecting: false,
    activeSessionId: null,
    nowPlaying: null,

    setConnected: (status) => set({ isConnected: status }),
    setConnecting: (status) => set({ isConnecting: status }),
    setSessionId: (id) => set({ activeSessionId: id }),
    setNowPlaying: (track) => set({ nowPlaying: track }),

    syncStatus: 'idle',
    syncProgress: null,
    lastSyncTime: null,
    setSyncStatus: (status) => set({ syncStatus: status }),
    setSyncProgress: (progress) => set({ syncProgress: progress }),
    setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
