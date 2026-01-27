import { create } from 'zustand';

interface NowPlaying {
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
}));
