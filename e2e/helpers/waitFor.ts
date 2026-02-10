import { expect } from 'detox';

/**
 * Custom wait utilities to handle common async UI patterns and reduce flakiness.
 */
export const waitForElement = {
    /**
     * Wait for an element to be visible with a custom timeout
     */
    toBeVisible: async (matcher: Detox.NativeMatcher, timeout = 30000) => {
        await waitFor(element(matcher))
            .toBeVisible()
            .withTimeout(timeout);
    },

    /**
     * Wait for an element to explicitly NOT be visible (e.g., loading spinner)
     */
    toBeNotVisible: async (matcher: Detox.NativeMatcher, timeout = 10000) => {
        await waitFor(element(matcher))
            .not.toBeVisible()
            .withTimeout(timeout);
    },

    /**
     * Wait for an element to exist (even if not visible yet)
     */
    toExist: async (matcher: Detox.NativeMatcher, timeout = 10000) => {
        await waitFor(element(matcher))
            .toExist()
            .withTimeout(timeout);
    }
};

/**
 * Sleep for a given amount of milliseconds.
 * USE SPARINGLY. Prefer explicit waits on elements.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
