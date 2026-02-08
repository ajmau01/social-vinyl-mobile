import * as Sentry from '@sentry/react-native';
import { CONFIG } from '@/config';

/**
 * Production-Safe Logger Utility
 * 
 * Security Hardening - Issue #71:
 * Replaces direct console.* calls to prevent sensitive data logging in production.
 * 
 * Usage:
 * - logger.log() - General information (dev only)
 * - logger.debug() - Detailed debugging (dev only)
 * - logger.error() - Errors (always logged, sent to Sentry in production)
 * - logger.warn() - Warnings (dev only)
 * 
 * In development (__DEV__ = true): All logs are visible
 * In production (__DEV__ = false): Only errors are logged
 */
class Logger {
    /**
     * General logging - only in development
     */
    log(...args: any[]) {
        if (__DEV__) {
            console.log(...args);
        }
    }

    /**
     * Debug logging - only in development
     */
    debug(...args: any[]) {
        if (__DEV__) {
            console.debug(...args);
        }
    }

    /**
     * Error logging - always logged
     * In production, this also reports to Sentry.
     */
    error(...args: any[]) {
        console.error(...args);

        // Issue #64: Report to Sentry in production (if initialized)
        if (CONFIG.SENTRY_DSN) {
            try {
                const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
                Sentry.captureException(error, {
                    extra: {
                        additionalContext: args.slice(1),
                    },
                });
            } catch (e) {
                // Prevent recursive logging failure
                console.error('[Logger] Failed to report error to Sentry:', e);
            }
        }
    }

    /**
     * Warning logging - only in development
     */
    warn(...args: any[]) {
        if (__DEV__) {
            console.warn(...args);
        }
    }

    /**
     * Info logging - only in development
     */
    info(...args: any[]) {
        if (__DEV__) {
            console.info(...args);
        }
    }
}

export const logger = new Logger();
