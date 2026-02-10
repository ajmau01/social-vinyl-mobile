import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('Bin Management', () => {
    beforeAll(async () => {
        await device.launchApp({ delete: true });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Disable sync to avoid animation hangs
        await device.disableSynchronization();

        // Login for each test
        await Auth.loginAsHost('bin_user');

        // Trigger Sync
        await waitForElement.toBeVisible(by.id('collection-header-sync-button'));
        await element(by.id('collection-header-sync-button')).tap();

        // Wait for sync to complete
        await waitFor(element(by.id('collection-header-sync-button')))
            .toBeVisible()
            .withTimeout(30000);

        await waitFor(element(by.text('5 Items')))
            .toBeVisible()
            .withTimeout(10000);

        // Wait for screen to be ready
        await waitForElement.toBeVisible(by.id('tab-bin'));
    });

    it('should navigate to Bin tab', async () => {
        // Wait for Tab Bar
        await waitForElement.toBeVisible(by.id('tab-bin'));

        // Tap Bin Tab
        await element(by.id('tab-bin')).tap();

        // Verify Bin Screen Title or unique element
        await expect(element(by.id('bin-screen-title'))).toBeVisible();
        // Or if title is dynamic, maybe empty state or list
        // Based on bin.tsx, we added IDs for list and empty state
    });

    it('should show empty state initially', async () => {
        await element(by.id('tab-bin')).tap();

        // Assuming bin starts empty for this user (configured via seed/mock)
        await expect(element(by.id('bin-empty-state'))).toBeVisible();
    });

    it('should display items added to bin', async () => {
        // Need to add item first. Ideally via API or UI.
        // UI approach:
        await element(by.id('tab-collection')).tap();
        await element(by.id('release-card-1001')).tap(); // instanceId 1001 (Thriller)
        await element(by.id('modal-add-to-bin-button')).tap();
        await element(by.id('modal-close-button')).tap();

        // Navigate back to bin
        await element(by.id('tab-bin')).tap();

        // Check item 101 is there
        await waitForElement.toBeVisible(by.id('bin-item-101'));
    });

    it('should remove item from bin', async () => {
        // Navigate to Bin (after reload)
        await element(by.id('tab-bin')).tap();

        // Assuming item 101 is still there from previous test
        await expect(element(by.id('bin-item-101'))).toBeVisible();

        // Find remove button for item
        await element(by.id('bin-remove-101')).tap();

        // Verify gone
        await waitForElement.toBeNotVisible(by.id('bin-item-101'));
    });

    it('should clear entire bin', async () => {
        // Add item
        await element(by.id('tab-collection')).tap();
        await element(by.id('release-card-1002')).tap(); // instanceId 1002 (DSOTM)
        await element(by.id('modal-add-to-bin-button')).tap();
        await element(by.id('modal-close-button')).tap();

        // Go to Bin
        await element(by.id('tab-bin')).tap();

        // Tap Clear Button
        await element(by.id('bin-clear-button')).tap();

        // Confirm alert (iOS Alert handling in Detox)
        await element(by.text('Clear')).tap(); // Adapting to standard alert button text

        // Verify empty state
        await waitForElement.toBeVisible(by.id('bin-empty-state'));
    });
});
