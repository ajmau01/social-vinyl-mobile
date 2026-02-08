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
     * TODO: Integrate with Sentry for production error tracking
     */
    error(...args: any[]) {
        console.error(...args);

        // TODO: Send to Sentry in production
        // if (!__DEV__) {
        //     Sentry.captureException(args[0], {
        //         extra: { additionalContext: args.slice(1) }
        //     });
        // }
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
