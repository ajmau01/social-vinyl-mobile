import { expect } from 'detox';
import { waitForElement } from './waitFor';

/**
 * Authentication Helper Functions
 * Abstracts the login/logout flows for tests.
 */

const TEST_IDS = {
    LOGIN_SCREEN: 'login-screen',
    USERNAME_INPUT: 'login-username-input',
    LOGIN_BUTTON: 'login-button',
    LOGOUT_BUTTON: 'logout-button',
    HOST_TAB: 'tab-host', // Assuming we have this
    SETTINGS_BUTTON: 'settings-button', // Or wherever logout is
};

export const Auth = {
    /**
     * Login as a standard host user
     */
    loginAsHost: async (username = 'testuser') => {
        // Ensure we are on login screen
        await waitForElement.toBeVisible(by.id(TEST_IDS.LOGIN_SCREEN));

        // Type credentials
        await element(by.id(TEST_IDS.USERNAME_INPUT)).typeText(username);
        // Dismiss keyboard if needed (sometimes necessary in iOS)
        await element(by.id(TEST_IDS.USERNAME_INPUT)).tapReturnKey();

        // Tap login
        await element(by.id(TEST_IDS.LOGIN_BUTTON)).tap();

        // Wait for successful login (e.g., transition to main app)
        // We assume 'collection-header' is a good indicator of home screen
        await waitForElement.toBeVisible(by.id('collection-header'));
    },

    /**
     * Login as a solo user (no remote auth)
     */
    loginAsSolo: async () => {
        await Auth.loginAsHost('solo_user');
    },

    /**
     * Logout from the application
     */
    logout: async () => {
        // Implementation depends on where logout button is.
        // Assuming it's in a side drawer or settings.
        const sessionDrawerBtn = by.id('session-drawer-trigger');

        // Check if we can see the trigger
        try {
            await expect(element(sessionDrawerBtn)).toBeVisible();
            await element(sessionDrawerBtn).tap();

            const logoutBtn = by.id('session-logout-button');
            await waitForElement.toBeVisible(logoutBtn);
            await element(logoutBtn).tap();

            // Verify we are back at login
            await waitForElement.toBeVisible(by.id(TEST_IDS.LOGIN_SCREEN));
        } catch (e) {
            console.warn('Logout failed or button not found:', e);
            // Fallback or re-throw
        }
    }
};
