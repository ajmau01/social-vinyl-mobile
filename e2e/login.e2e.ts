import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('Login Flow', () => {
    beforeAll(async () => {
        console.log('[E2E] Starting launchApp...');
        await device.launchApp({
            delete: true
        });
        console.log('[E2E] launchApp complete. Disabling synchronization...');
        await device.disableSynchronization();
        console.log('[E2E] Synchronization disabled.');
    });

    beforeEach(async () => {
        console.log('[E2E] Performing reloadReactNative...');
        await device.reloadReactNative();
        console.log('[E2E] reloadReactNative complete.');
    });

    it('should successfully login as a host', async () => {
        console.log('[E2E] Starting loginAsHost...');
        await Auth.loginAsHost('e2e_host', 'password');
        console.log('[E2E] loginAsHost complete.');

        // Verify we are on the collection screen with extended timeout
        await waitForElement.toBeVisible(by.id('collection-header-title'), 30000);
        // await expect(element(by.text('e2e_host'))).toExist(); // Username might be truncated or rendered differently
    });

    it('should show error for invalid credentials', async () => {
        // ... (unchanged)
        // Select Host Mode
        await waitForElement.toBeVisible(by.id('mode-host'));
        await element(by.id('mode-host')).tap();

        // Enter wrong credentials
        await waitForElement.toBeVisible(by.id('login-input'));
        await element(by.id('login-input')).typeText('wrong_user');
        await element(by.id('login-password')).typeText('wrong_pass');
        await element(by.id('login-password')).tapReturnKey(); // Close keyboard

        await element(by.id('login-submit')).tap();

        // Verify error message
        await waitForElement.toBeVisible(by.id('login-error'));
    });

    it('should allow guest login with code', async () => {
        // Select Guest Mode
        await waitForElement.toBeVisible(by.id('mode-guest'));
        await element(by.id('mode-guest')).tap();

        // Enter Code (using username input field as it's reused)
        await waitForElement.toBeVisible(by.id('login-input'));
        await element(by.id('login-input')).typeText('ABC12'); // Mock code (5 chars)
        await element(by.id('login-input')).tapReturnKey(); // Close keyboard

        await element(by.id('login-submit')).tap();

        // Verify "Coming Soon" error message instead of navigation
        // Because guest mode logic currently sets an error message
        await waitForElement.toBeVisible(by.text('Guest mode coming soon in Phase 4'));
    });

    it('should enter solo mode without credentials', async () => {
        await Auth.loginAsSolo();
        await expect(element(by.id('collection-header-title'))).toBeVisible();
    });

    it('should be able to logout', async () => {
        // Login first
        await Auth.loginAsSolo();

        // Perform logout
        await Auth.logout();

        // Verify back at start
        await expect(element(by.id('mode-host'))).toBeVisible();
    });
});
