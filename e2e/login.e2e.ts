import { by, device, element, expect, waitFor } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';
import { delay } from './helpers/waitFor';
import { dismissKeyboard } from './helpers/keyboard';

describe('Login Flow', () => {
    /**
     * Android Lifecycle Strategy:
     * Unlike iOS which uses reloadReactNative() in beforeEach, Android E2E
     * is more stable with a single launch in beforeAll. We then use
     * in-app navigation (e.g. Cancel button) to reset state between tests.
     * 
     * Rationale: reloadReactNative() on Android can cause parity issues
     * with Expo's dev-client architecture during high-frequency cycles.
     */
    beforeAll(async () => {
        console.log('[E2E] Starting launchApp...');
        await device.launchApp({
            newInstance: true,
            launchArgs: {
                detoxPrintResourceName: 'YES',
                detoxURLBlacklistRegex: '.*'
            }
        });
        console.log('[E2E] launchApp complete. Disabling synchronization...');
        await device.disableSynchronization();
        console.log('[E2E] Synchronization disabled.');
    });

    it('should display mode selection on launch', async () => {
        await waitForElement.toBeVisible(by.id('mode-host'), 30000);
        await expect(element(by.id('mode-guest'))).toBeVisible();
        await expect(element(by.id('mode-solo'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
        // Tap Host Mode
        await element(by.id('mode-host')).tap();

        // Wait for login form
        await waitForElement.toBeVisible(by.id('login-input'));
        await element(by.id('login-input')).tap();
        await element(by.id('login-input')).typeText('wrong_user');

        await element(by.id('login-password')).tap();
        await element(by.id('login-password')).typeText('wrong_pass');

        // Dismiss keyboard
        await dismissKeyboard();

        // Tap submit
        await element(by.id('login-submit')).tap();

        // Verify error appears
        await waitForElement.toBeVisible(by.id('login-error'));
        console.log('[E2E] Error message verified.');

        // Go back to mode selection
        await element(by.id('login-cancel')).tap();
        await waitForElement.toBeVisible(by.id('mode-host'));
    });

    it('should allow guest code entry', async () => {
        // Tap Guest Mode
        await element(by.id('mode-guest')).tap();

        // Enter code
        await waitForElement.toBeVisible(by.id('login-input'));
        await element(by.id('login-input')).tap();
        await element(by.id('login-input')).typeText('ABC12');

        // Dismiss keyboard
        await dismissKeyboard();

        await element(by.id('login-submit')).tap();

        // Verify "Coming Soon" error message
        await waitForElement.toBeVisible(by.text('Guest mode coming soon in Phase 4'));

        // Go back
        await element(by.id('login-cancel')).tap();
        await waitForElement.toBeVisible(by.id('mode-host'));
    });

    it('should successfully login as a host', async () => {
        console.log('[E2E] Starting host login...');

        // Tap host mode
        await element(by.id('mode-host')).tap();
        await waitForElement.toBeVisible(by.id('login-input'));

        // Enter credentials
        await element(by.id('login-input')).tap();
        await element(by.id('login-input')).typeText('e2e_host');

        await element(by.id('login-password')).tap();
        await element(by.id('login-password')).typeText('password');

        // Dismiss keyboard
        await dismissKeyboard();

        // Tap submit
        await element(by.id('login-submit')).tap();

        // Verify navigation to collection screen
        await waitForElement.toBeVisible(by.id('collection-header-title'), 30000);
        console.log('[E2E] Host login successful.');
    });
});
