import * as Sentry from '@sentry/react-native';
import { CONFIG } from '@/config';
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, UIManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';

import { THEME } from '@/constants/theme';
import { logger } from '@/utils/logger';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket, useSessionTimeout } from '@/hooks';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';
import { LogBox } from 'react-native';
import { validatePartyCode } from '@/utils/validation';

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
  const { username, authToken, sessionId, sessionRole } = useSessionStore();
  const { connect, disconnect } = useWebSocket({ isManager: true });

  useEffect(() => {
    // Manage Connection Lifecycle using the hook's actions.
    // Require BOTH username AND authToken before connecting — if authToken was
    // deliberately cleared (e.g. auth failure), we must NOT reconnect or the
    // stale-token rejection loop will spin indefinitely.
    if (username && authToken) {
      connect();
    } else if (sessionId && sessionRole === 'guest') {
      // Guest in active session — WS was established via the join flow directly.
      // Do NOT disconnect: that would kill the connection right after joining.
      logger.log('[WebSocketManager] Skipping disconnect: guest in active session');
    } else {
      disconnect();
    }
  }, [username, authToken, sessionId, sessionRole, connect, disconnect]);

  return null; // This component only manages side effects
}

function RootLayout() {
  const { hydrateCredentials, updateLastInteraction } = useSessionStore();
  const router = useRouter();
  const url = Linking.useURL();
  const hasRouted = useRef(false);

  // Hydrate token from SecureStore on app start.
  // If the user is authenticated, always route through / so the isIdleHost
  // and isSessionActive gates in index.tsx can evaluate — even if Expo Router
  // restored navigation state to a tab on a previous session.
  useEffect(() => {
    const init = async () => {
      await hydrateCredentials();
      const { authToken } = useSessionStore.getState();
      if (!hasRouted.current) {
        hasRouted.current = true;
        if (authToken) {
          router.replace('/');
        }
      }
    };
    init();
    // Issue #126: Initialize Listening Bin Sync Service
    listeningBinSyncService.init();
  }, []);

  // Issue #128: Process Deep Links (socialvinyl://join?code=XXXXX)
  // NOTE: Deep links trigger an immediate router.push(), which effectively 
  // bypasses the WelcomeScreen (index.tsx) for guest entry.
  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      if (parsed.hostname === 'join' || parsed.path === 'join' || parsed.path === 'join-session') {
        const joinCode = parsed.queryParams?.code;
        if (joinCode && typeof joinCode === 'string' && validatePartyCode(joinCode)) {
          // Pre-populate join code and kick off background WS if possible
          const store = useSessionStore.getState();
          store.setJoinCode(joinCode);

          // If we have a username/token, WebSocketManager will handle connection.
          // If not, we just navigate and let GuestJoinModal handle it.
          
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
        <GestureHandlerRootView
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
            <Stack.Screen name="want-list" />
          </Stack>
        </GestureHandlerRootView>
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
