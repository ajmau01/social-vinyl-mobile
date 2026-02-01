import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { wsService } from '@/services/WebSocketService';
import { NowPlayingBanner } from '@/components/NowPlayingBanner';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { CONFIG } from '@/config';

export default function RootLayout() {
  const { username, authToken } = useSessionStore();

  useEffect(() => {
    // Register Global Callbacks to bridge decoupled service to store
    wsService.setCallbacks({
      onConnectionStateChange: (state) => {
        const store = useSessionStore.getState();
        store.setConnected(state === 'connected');
        store.setConnecting(state === 'connecting' || state === 'reconnecting');
      },
      onSessionJoined: (data) => {
        const store = useSessionStore.getState();
        if (data.authToken) store.setAuthToken(data.authToken);
        if (data.sessionId) store.setSessionId(data.sessionId);
      },
      onNowPlaying: (data) => {
        const store = useSessionStore.getState();
        store.setNowPlaying({
          ...data,
          releaseId: data.releaseId || undefined
        });
      },
      onSessionEnded: () => {
        const store = useSessionStore.getState();
        store.setSessionId(null);
        store.setNowPlaying(null);
      },
      onMessage: () => {
        // Raw messages still available if needed, but semantic events preferred
      },
      onAccessLevel: (level) => {
        if (CONFIG.DEBUG_WS) console.log('[WS] Access Level:', level);
      },
      onError: (error) => {
        console.error('[WS] Error:', error);
      }
    });

    return () => {
      wsService.clearCallbacks();
    };
  }, []);

  useEffect(() => {
    // Manage Connection Lifecycle
    if (username) {
      wsService.connect(username, authToken || undefined);
    } else {
      wsService.disconnect();
    }
  }, [username, authToken]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* Persistent Banner Overlay */}
      <NowPlayingBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
