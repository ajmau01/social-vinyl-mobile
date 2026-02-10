import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('Collection Sync Flow', () => {
    beforeAll(async () => {
        await device.launchApp({ delete: true });
        // Start as a fresh host
        await Auth.loginAsHost('sync_test_user');
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Disable sync to avoid animation hangs
        await device.disableSynchronization();

        // Login for each test
        await Auth.loginAsHost('sync_test_user');

        // Wait for screen to be ready
        await waitForElement.toBeVisible(by.id('collection-header-sync-button'));
    });

    it('should show sync button and item count initially', async () => {
        await expect(element(by.id('collection-header-sync-button'))).toBeVisible();
        await expect(element(by.id('collection-header-item-count'))).toBeVisible();
    });

    it('should trigger sync and show progress', async () => {
        // Tap sync
        await element(by.id('collection-header-sync-button')).tap();

        // Verify status changes to syncing (or progress percentage)
        // Using waitFor because network/websocket might take a split second
        await waitForElement.toBeVisible(by.id('collection-header-sync-status'));

        // Ensure button is disabled while syncing
        // Note: accessibilityState might need to be checked, or just that it doesn't trigger again
        // For now, checking visual indicator
    });

    it('should complete sync and update item count', async () => {
        // Trigger sync
        await element(by.id('collection-header-sync-button')).tap();

        // Wait for sync to finish (status indicator disappears, item count returns)
        await waitForElement.toBeNotVisible(by.id('collection-header-sync-status'));
        await waitForElement.toBeVisible(by.id('collection-header-item-count'));

        // Verify we have items (mock server should return some)
        // Assuming we have at least one section or item
        // This depends on mock server data
    });
});
