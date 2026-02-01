import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { wsService } from '@/services/WebSocketService';
import { NowPlayingBanner } from '@/components/NowPlayingBanner';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';

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
      onMessage: (rawData) => {
        const store = useSessionStore.getState();
        const type = rawData.type || rawData.messageType;

        switch (type) {
          case 'WELCOME':
          case 'welcome':
          case 'ACCESS_LEVEL':
          case 'access-level':
          case 'admin-login-success':
            if (rawData.authToken) store.setAuthToken(rawData.authToken);
            if (rawData.sessionId) store.setSessionId(rawData.sessionId);
            break;
          case 'NOW_PLAYING':
          case 'now-playing':
            if (rawData.album) {
              const { album } = rawData;
              store.setNowPlaying({
                track: album.title,
                artist: album.artist,
                album: album.title,
                albumArt: album.coverImage,
                releaseId: String(album.releaseId),
                timestamp: Date.now()
              });
            }
            break;
          case 'SESSION_ENDED':
          case 'session-ended':
            store.setSessionId(null);
            store.setNowPlaying(null);
            break;
        }
      },
      onError: (error) => {
        console.error('[WS] Error:', error);
      }
    });
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
