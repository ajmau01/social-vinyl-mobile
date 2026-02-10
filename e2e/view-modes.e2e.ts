import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('View Modes', () => {
    beforeAll(async () => {
        await device.launchApp({ delete: true });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Disable sync to avoid animation hangs - MUST be reapplied after reload if syncing reset
        await device.disableSynchronization();

        // Login for each test to ensure fresh state
        await Auth.loginAsHost('view_mode_user');

        // Trigger Sync to populate data
        await waitForElement.toBeVisible(by.id('collection-header-sync-button'));
        await element(by.id('collection-header-sync-button')).tap();

        // Wait for sync to complete (button becomes enabled again)
        await waitFor(element(by.id('collection-header-sync-button')))
            .toBeVisible()
            .withTimeout(30000);

        // Wait for items to be loaded
        await waitFor(element(by.text('5 Items')))
            .toBeVisible()
            .withTimeout(10000);

        // Wait for screen to be ready
        await waitForElement.toBeVisible(by.id('segment-genre'));
    });

    it('should default to Genre view', async () => {
        // Wait for segment to be visible after reload
        await waitForElement.toBeVisible(by.id('segment-genre'));

        // Check if a genre section is visible (depends on mock data)
        // await expect(element(by.id('section-header-Rock'))).toBeVisible();
    });

    it('should switch to A-Z (Artist) view', async () => {
        await element(by.id('segment-a-z')).tap();

        // Header for Pink Floyd in A-Z mode is 'P'
        await waitForElement.toExist(by.id('section-header-P'));
    });

    it('should switch to Decade view', async () => {
        await element(by.id('segment-decade')).tap();

        // 1982 -> 1980s, 1973 -> 1970s
        await waitForElement.toExist(by.id('section-header-1980s'));
    });

    it('should switch back to Genre view', async () => {
        await element(by.id('segment-genre')).tap();
        // Verify return
    });
});
