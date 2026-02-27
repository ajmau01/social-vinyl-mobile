// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { device } from 'detox';

/**
 * Database & Environment Helpers
 */
export const Database = {
    /**
     * Reset the app to a fresh state (clears SecureStore and SQLite).
     * Uses Detox's launchApp with delete: true.
     */
    reset: async () => {
        await device.launchApp({
            delete: true,
            permissions: { notifications: 'YES' },
        });
    },

    /**
     * Launch the app without deleting data (preserves state).
     */
    launch: async () => {
        await device.launchApp({
            newInstance: true,
        });
    },

    /**
     * Seed data into the mock server (if the server supports dynamic seeding via API).
     * For Phase 1, the Mock Server has static seed data, so this might be a no-op 
     * or a fetch call to the mock server's control endpoint if we build one.
     */
    seedData: async () => {
        // Placeholder: Could make a fetch request to http://localhost:9080/control/seed
        // to reset server state if needed.
        // console.log('Seeding data...');
    }
};
