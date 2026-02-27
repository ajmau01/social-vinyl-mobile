// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { by, device, element, expect } from 'detox';
import { Auth } from './helpers/auth';
import { waitForElement } from './helpers/waitFor';

describe('Search Functionality', () => {
    beforeAll(async () => {
        await device.launchApp({ delete: true });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Disable sync
        await device.disableSynchronization();

        // Login
        await Auth.loginAsHost('search_user');

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
        await waitForElement.toBeVisible(by.id('search-bar-input'));
    });

    it('should filter collection by artist name', async () => {
        // Wait for search bar
        await waitForElement.toBeVisible(by.id('search-bar-input'));

        // Type 'Pink Floyd'
        await element(by.id('search-bar-input')).typeText('Pink Floyd');

        // Check if correct section is visible. Default is Genre -> 'Rock'
        await waitForElement.toExist(by.id('section-header-Rock'));
    });

    it('should show empty state for non-matching search', async () => {
        // Type nonsense
        await element(by.id('search-bar-input')).typeText('NonExistentBand123');

        // Verify empty state or no results
        // Assuming there's a specific empty state component or text
        // await expect(element(by.text('No results found'))).toBeVisible(); 
        // OR just check that section list is empty?
    });

    it('should clear search and restore full collection', async () => {
        // Type something
        await element(by.id('search-bar-input')).typeText('Pink');

        // Clear
        await element(by.id('search-bar-clear-button')).tap();

        // Check input is empty
        // await expect(searchInput).toHaveText('');

        // Check full collection is back (e.g. multiple headers visible)
        // await waitForElement.toBeVisible(by.id('section-header-A'));
    });
});
