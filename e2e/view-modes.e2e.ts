// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

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

        // Trigger Sync to populate data via Pull-to-Refresh
        await element(by.id('collection-section-list')).swipe('down', 'fast', 0.8);

        // Wait for sync to complete (should return to "Updated just now")
        await waitFor(element(by.id('collection-header-cache-status')))
            .toHaveText('Updated just now')
            .withTimeout(30000);

        // Wait for screen to be ready
        await waitForElement.toBeVisible(by.id('segment-genre'));
    });

    it('should default to Genre view', async () => {
        await expect(element(by.id('segment-genre'))).toBeVisible();
    });

    it('should switch to A-Z (Artist) view', async () => {
        await element(by.id('segment-a-z')).tap();
        // Header for Pink Floyd in A-Z mode is 'P'
        await waitForElement.toExist(by.id('section-header-P'));
    });

    it('should switch to Decade view', async () => {
        await element(by.id('segment-decade')).tap();
        await waitForElement.toExist(by.id('section-header-1980s'));
    });

    it('should switch to New view (Empty state)', async () => {
        await element(by.id('segment-new')).tap();
        await expect(element(by.id('empty-collection-state'))).toBeVisible();
    });

    it('should switch to Spin view (Empty state)', async () => {
        await element(by.id('segment-spin')).tap();
        await expect(element(by.id('empty-collection-state'))).toBeVisible();
    });

    it('should switch to Saved view (Empty state)', async () => {
        await element(by.id('segment-saved')).tap();
        await expect(element(by.id('empty-collection-state'))).toBeVisible();
    });
});
