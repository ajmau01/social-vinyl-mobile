import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket, useSessionTimeout } from '@/hooks';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * WebSocketManager - Manages WebSocket connection lifecycle
 * Must be inside ServiceProvider to access useWebSocket hook
 */
function WebSocketManager() {
  const { username, authToken } = useSessionStore();
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    // Manage Connection Lifecycle using the hook's actions
    if (username) {
      connect();
    } else {
      disconnect();
    }
  }, [username, authToken, connect, disconnect]);

  return null; // This component only manages side effects
}

export default function RootLayout() {
  const { hydrateAuthToken, updateLastInteraction } = useSessionStore();

  // Hydrate token from SecureStore on app start
  useEffect(() => {
    hydrateAuthToken();
  }, []);

  // Activate Session Timeout Logic
  useSessionTimeout();

  return (
    <ErrorBoundary>
      <ServiceProvider>
        <WebSocketManager />
        <View
          style={styles.container}
          onStartShouldSetResponderCapture={() => {
            updateLastInteraction();
            return false; // Don't block child responders
          }}
        >
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </ServiceProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
