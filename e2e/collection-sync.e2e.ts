// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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
        await waitForElement.toBeVisible(by.id('collection-header-title'));
    });

    it('should show cache status initially', async () => {
        await expect(element(by.id('collection-header-cache-status'))).toBeVisible();
    });

    it('should trigger sync via pull-to-refresh and show progress', async () => {
        // Trigger sync via pull-to-refresh
        // We use a swipe down on the main list
        await element(by.id('collection-section-list')).swipe('down', 'fast', 0.8);

        // Verify status changes to syncing
        await waitForElement.toBeVisible(by.id('collection-header-cache-status'));
        await expect(element(by.id('collection-header-cache-status'))).toHaveText('Syncing... 0%');
    });

    it('should complete sync and update cache status', async () => {
        // Trigger sync
        await element(by.id('collection-section-list')).swipe('down', 'fast', 0.8);

        // Wait for sync to finish (should return to "Updated just now")
        await waitFor(element(by.id('collection-header-cache-status')))
            .toHaveText('Updated just now')
            .withTimeout(10000);
    });
});
