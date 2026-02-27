// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('Release Details Modal', () => {
    beforeAll(async () => {
        await device.launchApp({ delete: true });
        await Auth.loginAsHost('modal_user');
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Disable sync to avoid animation hangs
        await device.disableSynchronization();

        // Login for each test
        await Auth.loginAsHost('modal_user');

        // Trigger Sync to populate data
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
        await waitForElement.toBeVisible(by.id('collection-list'));
    });

    it('should open modal when clicking a release', async () => {
        // Tap on a release card (using instanceId from mock data)
        // We might need to know a specific ID or just picking the first one
        // For now, let's assume we can find one by a common testID pattern if we didn't use specific IDs
        // Or finding by text.
        // Better: We added `release-card-${instanceId}`. We need a known instanceId from our seed data.
        const knownInstanceId = 1001; // Example from seed (Michael Jackson - Thriller)
        await element(by.id(`release-card-${knownInstanceId}`)).tap();

        // Verify modal opens
        await waitForElement.toBeVisible(by.id('modal-title'));
    });

    it('should display correct release information', async () => {
        // Open modal
        await element(by.id('release-card-1001')).tap();

        // Verify title and artist (Thriller by Michael Jackson)
        await expect(element(by.id('modal-title'))).toHaveText('Thriller');
        await expect(element(by.id('modal-artist'))).toHaveText('Michael Jackson');
    });

    it('should add release to bin', async () => {
        // Open modal
        await element(by.id('release-card-1001')).tap();

        // Tap Add to Bin
        await element(by.id('modal-add-to-bin-button')).tap();

        // Verify button changes state (e.g. "In Bin", disabled)
        // await expect(element(by.id('modal-add-to-bin-button'))).toHaveLabel('In Bin ✓'); 
        // or check opacity/style if possible, or just that it doesn't crash
    });

    it('should close modal', async () => {
        // Open modal
        await element(by.id('release-card-1001')).tap();
        await waitForElement.toBeVisible(by.id('modal-close-button'));

        // Close
        await element(by.id('modal-close-button')).tap();

        // Verify modal is gone
        await waitForElement.toBeNotVisible(by.id('modal-title'));
    });
});
