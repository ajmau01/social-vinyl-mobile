import * as Sentry from '@sentry/react-native';
import { CONFIG } from '@/config';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, UIManager } from 'react-native';
import * as Linking from 'expo-linking';

import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket, useSessionTimeout } from '@/hooks';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
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

  // Debug Auth Flow (Removed noise)
  /*
  if (username) {
    console.log('[WebSocketManager] Auth State:', {
      username,
      hasToken: !!authToken,
      tokenLength: authToken?.length,
      useMessageAuth: CONFIG.USE_MESSAGE_AUTH
    });
  }
  */

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
  const router = useRouter();
  const url = Linking.useURL();

  // Hydrate token from SecureStore on app start
  useEffect(() => {
    hydrateCredentials();
    // Issue #126: Initialize Listening Bin Sync Service
    listeningBinSyncService.init();
  }, []);

  // Issue #128: Process Deep Links (socialvinyl://join?code=XXXXX)
  // NOTE: Deep links trigger an immediate router.push(), which effectively 
  // bypasses the WelcomeScreen (index.tsx) for guest entry.
  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      if (parsed.path === 'join' || parsed.path === 'join-session') {
        const joinCode = parsed.queryParams?.code;
        if (joinCode && typeof joinCode === 'string') {
          // Slight delay to ensure router navigation hierarchy is completely mounted
          setTimeout(() => {
            router.push(`/join-session?code=${joinCode}`);
          }, 300);
        }
      }
    }
  }, [url, router]);

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
            <Stack.Screen name="session-list" />
            <Stack.Screen name="create-session" />
            <Stack.Screen name="join-session" />
            <Stack.Screen name="account-create" />
            <Stack.Screen name="account-login" />
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
