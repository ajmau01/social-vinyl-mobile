import Constants from 'expo-constants';

/**
 * Application Configuration
 * 
 * Security Hardening:
 * - Issue #74: Debug flags now use __DEV__ instead of hardcoded values
 * - Issue #66: API URLs now use environment variables instead of hardcoded values
 * 
 * Environment Variables (set during build):
 * - API_URL: Backend API base URL
 * - WS_URL: WebSocket endpoint URL
 * - DEBUG_WS: Enable WebSocket debug logging (optional, defaults to __DEV__)
 * 
 * Example build command:
 * API_URL=https://prod.example.com WS_URL=wss://prod.example.com/ws/listening-bin eas build
 */
// Check for E2E mode (injected via Metro/Babel or process.env)
const IS_E2E = process.env.EXPO_PUBLIC_E2E_MODE === 'true' || process.env.E2E_MODE === 'true';

export const CONFIG = {
    // Environment-based configuration with localhost defaults for development
    API_URL: IS_E2E ? 'http://localhost:9080' : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'),
    WS_URL: IS_E2E ? 'ws://localhost:9080/ws' : (process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8080/ws'),
    IS_E2E,

    // Issue #74: Use __DEV__ for automatic dev/prod separation
    // Can be overridden via DEBUG_WS environment variable if needed
    DEBUG_WS: Constants.expoConfig?.extra?.debugWs || __DEV__,

    // Issue #68: Preparation for message-based authentication
    USE_MESSAGE_AUTH: Constants.expoConfig?.extra?.useMessageAuth ?? false,

    // Issue #64: Sentry Configuration
    SENTRY_DSN: Constants.expoConfig?.extra?.sentryDsn || null,
};
