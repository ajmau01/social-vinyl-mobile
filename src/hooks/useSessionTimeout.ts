import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSessionStore } from '@/store/useSessionStore';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

/**
 * Hook to manage idle session timeouts.
 * Automatically logs out the user if no activity is detected for 30 minutes.
 * Part of Security Hardening - Issue #69.
 */
export const useSessionTimeout = () => {
    const router = useRouter();
    const { lastInteractionTime, clearSession, username } = useSessionStore();
    const timerRef = useRef<any>(null);

    // Issue #3 review feedback: Early return for E2E mode
    if (CONFIG.IS_E2E) return;

    useEffect(() => {
        if (!username) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const checkTimeout = () => {
            const now = Date.now();
            if (now - lastInteractionTime > TIMEOUT_MS) {
                logger.log('[Auth] Session timed out due to inactivity');
                clearSession().then(() => {
                    router.replace('/');
                });
            }
        };

        // Initial check
        checkTimeout();

        // Periodic check
        timerRef.current = setInterval(checkTimeout, CHECK_INTERVAL_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [lastInteractionTime, username, clearSession, router]);
};
