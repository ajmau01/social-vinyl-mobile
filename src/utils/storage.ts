import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

/**
 * Secure Storage Utility
 * Part of Security Hardening - Issue #67.
 * Uses Expo SecureStore for encrypted on-device storage.
 */

const AUTH_TOKEN_KEY = 'auth_token';

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
    }
};
