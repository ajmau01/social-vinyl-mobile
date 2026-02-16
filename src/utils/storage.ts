import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

/**
 * Secure Storage Utility
 * Part of Security Hardening - Issue #67.
 * Uses Expo SecureStore for encrypted on-device storage.
 */

const AUTH_TOKEN_KEY = 'auth_token';
const SESSION_ID_KEY = 'session_id';
const SESSION_SECRET_KEY = 'session_secret';

export const secureStorage = {
    /**
     * Saves the authentication token securely.
     */
    async saveAuthToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        } catch (error) {
            logger.error('[Storage] Failed to save secure token:', error);
            throw error;
        }
    },

    /**
     * Retrieves the authentication token from secure storage.
     */
    async getAuthToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        } catch (error) {
            logger.error('[Storage] Failed to get secure token:', error);
            return null;
        }
    },

    /**
     * Deletes the authentication token from secure storage.
     */
    async deleteAuthToken(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        } catch (error) {
            logger.error('[Storage] Failed to delete secure token:', error);
            throw error;
        }
    },

    /**
     * Saves session credentials securely.
     */
    async saveSessionCredentials(sessionId: string, sessionSecret: string): Promise<void> {
        try {
            // Issue #8: Defensive validation to prevent storing "undefined" strings
            if (!sessionId || sessionId === 'undefined') {
                logger.warn('[Storage] Attempted to save invalid sessionId');
                return;
            }
            if (!sessionSecret || sessionSecret === 'undefined') {
                logger.warn('[Storage] Attempted to save invalid sessionSecret');
                return;
            }

            // Force string cast to prevent "Invalid value" errors in SecureStore
            await SecureStore.setItemAsync(SESSION_ID_KEY, String(sessionId));
            await SecureStore.setItemAsync(SESSION_SECRET_KEY, String(sessionSecret));
        } catch (error) {
            logger.error('[Storage] Failed to save session credentials:', error);
            throw error;
        }
    },

    /**
     * Retrieves session credentials securely.
     */
    async getSessionCredentials(): Promise<{ sessionId: string | null; sessionSecret: string | null }> {
        try {
            const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);
            const sessionSecret = await SecureStore.getItemAsync(SESSION_SECRET_KEY);
            return { sessionId, sessionSecret };
        } catch (error) {
            logger.error('[Storage] Failed to get session credentials:', error);
            return { sessionId: null, sessionSecret: null };
        }
    },

    /**
     * Deletes session credentials securely.
     */
    async deleteSessionCredentials(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(SESSION_ID_KEY);
            await SecureStore.deleteItemAsync(SESSION_SECRET_KEY);
        } catch (error) {
            logger.error('[Storage] Failed to delete session credentials:', error);
            throw error;
        }
    }
};
