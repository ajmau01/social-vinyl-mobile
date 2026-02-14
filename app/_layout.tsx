import * as Sentry from '@sentry/react-native';
import { CONFIG } from '@/config';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, UIManager } from 'react-native';

import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket, useSessionTimeout } from '@/hooks';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { LogBox } from 'react-native';

if (CONFIG.IS_E2E) {
  LogBox.ignoreAllLogs();
  console.log('[BOOT] E2E Mode detected. IS_E2E:', CONFIG.IS_E2E);
}

// Initialize Sentry before the component renders
// Harden check: Only initialize if DSN looks valid (starts with https://)
const shouldInitSentry = !CONFIG.IS_E2E && CONFIG.SENTRY_DSN && typeof CONFIG.SENTRY_DSN === 'string' && CONFIG.SENTRY_DSN.startsWith('https://');

if (shouldInitSentry) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    debug: __DEV__,
    tracesSampleRate: 1.0,
  });
}

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

function RootLayout() {
  const { hydrateCredentials, updateLastInteraction } = useSessionStore();

  // Hydrate token from SecureStore on app start
  useEffect(() => {
    hydrateCredentials();
  }, []);

  // Activate Session Timeout Logic (handles E2E internally)
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

const ExportedLayout = shouldInitSentry ? Sentry.wrap(RootLayout) : RootLayout;
export default ExportedLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
