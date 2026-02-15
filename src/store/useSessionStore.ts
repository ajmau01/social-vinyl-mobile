import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '@/utils/storage';

import { NowPlaying, SyncStatus, ConnectionState } from '@/types';

interface SessionState {
    connectionState: ConnectionState;
    sessionId: string | null;
    nowPlaying: NowPlaying | null;
    username: string | null;
    avatarUrl: string | null;
    authToken: string | null;
    sessionSecret: string | null;
    lastMode: 'host' | 'guest' | 'solo' | null;
    error: string | null;
    lastInteractionTime: number;

    // Actions
    setConnectionState: (state: ConnectionState) => void;
    setSessionId: (id: string | null) => void;
    setNowPlaying: (track: NowPlaying | null) => void;
    setUsername: (username: string | null) => void;
    setAvatarUrl: (url: string | null) => void;
    setAuthToken: (token: string | null) => Promise<void>;
    setSessionSecret: (secret: string | null) => Promise<void>;
    hydrateCredentials: () => Promise<void>;
    updateLastInteraction: () => void;
    clearSession: () => Promise<void>;
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

    // Issue #125: Protocol Features
    enabledFeatures: string[];
    setEnabledFeatures: (features: string[]) => void;
    isFeatureEnabled: (feature: string) => boolean;

    // Issue #126: Session Metadata
    sessionName: string | null;
    hostUsername: string | null;
    setSessionName: (name: string | null) => void;
    setHostUsername: (username: string | null) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            connectionState: 'disconnected',
            sessionId: null,
            nowPlaying: null,
            username: null,
            avatarUrl: null,
            authToken: null,
            sessionSecret: null,
            lastMode: null,
            error: null,
            lastInteractionTime: Date.now(),

            setConnectionState: (state) => set({ connectionState: state }),
            setSessionId: async (id) => {
                set({ sessionId: id });
                // If we have both id and secret, save them securely
                const { sessionSecret } = useSessionStore.getState();
                if (id && sessionSecret) {
                    await secureStorage.saveSessionCredentials(id, sessionSecret);
                }
            },
            setNowPlaying: (track) => set({ nowPlaying: track }),
            setUsername: (username) => set({ username }),
            setAvatarUrl: (url) => set({ avatarUrl: url }),
            setAuthToken: async (token) => {
                if (token) {
                    await secureStorage.saveAuthToken(token);
                } else {
                    await secureStorage.deleteAuthToken();
                }
                set({ authToken: token, lastInteractionTime: Date.now() });
            },
            setSessionSecret: async (secret) => {
                set({ sessionSecret: secret });
                const { sessionId } = useSessionStore.getState();
                if (sessionId && secret) {
                    await secureStorage.saveSessionCredentials(sessionId, secret);
                }
            },
            hydrateCredentials: async () => {
                const token = await secureStorage.getAuthToken();
                const { sessionId, sessionSecret } = await secureStorage.getSessionCredentials();
                set({
                    authToken: token,
                    sessionId: sessionId || useSessionStore.getState().sessionId,
                    sessionSecret: sessionSecret
                });
            },
            updateLastInteraction: () => set({ lastInteractionTime: Date.now() }),
            clearSession: async () => {
                await secureStorage.deleteAuthToken();
                await secureStorage.deleteSessionCredentials();
                set({
                    sessionId: null,
                    authToken: null,
                    sessionSecret: null,
                    username: null,
                    avatarUrl: null,
                    nowPlaying: null,
                    lastInteractionTime: Date.now()
                });
            },
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

            // Issue #125: Protocol Features
            enabledFeatures: [],
            setEnabledFeatures: (features) => set({ enabledFeatures: features }),
            isFeatureEnabled: (feature) => {
                const { enabledFeatures } = get();
                return enabledFeatures.includes(feature);
            },

            // Issue #126: Session Metadata
            sessionName: null,
            hostUsername: null,
            setSessionName: (name) => set({ sessionName: name }),
            setHostUsername: (username) => set({ hostUsername: username }),
        }),
        {
            name: 'session-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                username: state.username,
                avatarUrl: state.avatarUrl,
                sessionId: state.sessionId,
                sessionSecret: state.sessionSecret,
                lastMode: state.lastMode,
                lastSyncTime: state.lastSyncTime,
                enabledFeatures: state.enabledFeatures
            }),
        }
    )
);
