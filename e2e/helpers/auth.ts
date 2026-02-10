import { expect } from 'detox';
import { waitForElement } from './waitFor';

/**
 * Authentication Helper Functions
 * Abstracts the login/logout flows for tests.
 */

const TEST_IDS = {
    // Mode Selection
    MODE_HOST: 'mode-host',
    MODE_GUEST: 'mode-guest',
    MODE_SOLO: 'mode-solo',

    // Login Form
    LOGIN_INPUT: 'login-input',
    LOGIN_PASSWORD: 'login-password', // Only for host
    LOGIN_SUBMIT: 'login-submit',
    LOGIN_CANCEL: 'login-cancel',
    LOGIN_ERROR: 'login-error',

    // Navigation / Headers
    HEADER_TITLE: 'header-title',
    COLLECTION_HEADER: 'collection-header-title',
    MENU_BUTTON: 'collection-header-menu-button',

    // Drawer
    DRAWER_LOGOUT: 'drawer-logout-button',
    DRAWER_CLOSE: 'drawer-close-button',
};

export const Auth = {
    /**
     * Login as a standard host user
     */
    loginAsHost: async (username = 'testuser', password = 'password') => {
        // 1. Select Host Mode
        await waitForElement.toBeVisible(by.id(TEST_IDS.MODE_HOST));
        await element(by.id(TEST_IDS.MODE_HOST)).tap();

        // 2. Enter Credentials
        await waitForElement.toBeVisible(by.id(TEST_IDS.LOGIN_INPUT));
        await element(by.id(TEST_IDS.LOGIN_INPUT)).typeText(username);
        // await element(by.id(TEST_IDS.LOGIN_INPUT)).tapReturnKey(); // Optional

        await element(by.id(TEST_IDS.LOGIN_PASSWORD)).typeText(password);
        await element(by.id(TEST_IDS.LOGIN_PASSWORD)).tapReturnKey();

        // 3. Submit
        await element(by.id(TEST_IDS.LOGIN_SUBMIT)).tap();

        // 3. Verify Login
        await waitForElement.toBeVisible(by.id(TEST_IDS.COLLECTION_HEADER), 30000);
    },

    /**
     * Login as a solo user (no remote auth)
     */
    loginAsSolo: async () => {
        // 1. Select Solo Mode
        await waitForElement.toBeVisible(by.id(TEST_IDS.MODE_SOLO));
        await element(by.id(TEST_IDS.MODE_SOLO)).tap();

        // 2. Solo mode might jump straight in, or ask for simple username
        // Assuming simple username for now based on app code
        try {
            await waitForElement.toBeVisible(by.id(TEST_IDS.LOGIN_INPUT));
            await element(by.id(TEST_IDS.LOGIN_INPUT)).typeText('solo_user');
            await element(by.id(TEST_IDS.LOGIN_SUBMIT)).tap();
        } catch (e) {
            // Already in?
        }

        await waitForElement.toBeVisible(by.id(TEST_IDS.HEADER_TITLE));
    },

    /**
     * Logout from the application
     */
    logout: async () => {
        // 1. Open Menu
        await waitForElement.toBeVisible(by.id(TEST_IDS.MENU_BUTTON));
        await element(by.id(TEST_IDS.MENU_BUTTON)).tap();

        // 2. Tap Logout in Drawer
        await waitForElement.toBeVisible(by.id(TEST_IDS.DRAWER_LOGOUT));
        await element(by.id(TEST_IDS.DRAWER_LOGOUT)).tap();

        // 3. Verify back at Mode Selection
        await waitForElement.toBeVisible(by.id(TEST_IDS.MODE_HOST));
    }
};
