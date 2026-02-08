import Constants from 'expo-constants';
import { logger } from './logger';

/**
 * Network Security Utility
 * Part of Security Hardening - Issue #72.
 * Manages SSL Pinning configuration and security feature flags.
 */

// Public Key Hashes (Subject Public Key Info - SPKI)
// TODO: Update these when a stable production domain is available.
const PRODUCTION_PIN_HASHES = [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Placeholder 1
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Placeholder 2 (Backup)
];

export const networkSecurity = {
    /**
     * Returns whether SSL pinning should be enabled.
     * Currently disabled by default as we are using temporary Cloudflare tunnels.
     */
    isSslPinningEnabled(): boolean {
        // Feature flag from app.config.js or default to false
        const enabled = Constants.expoConfig?.extra?.sslPinningEnabled ?? false;

        if (enabled && !Constants.expoConfig?.extra?.apiUrl?.includes('localhost')) {
            return true;
        }

        return false;
    },

    /**
     * Returns the public key hashes for pinning.
     */
    getPinningHashes(): string[] {
        return PRODUCTION_PIN_HASHES;
    },

    /**
     * Logs a security event related to network communication.
     */
    logSecurityEvent(event: string, details: any) {
        logger.warn(`[Security] Network Event: ${event}`, details);
        // TODO: Send to analytics/Sentry in production
    }
};
