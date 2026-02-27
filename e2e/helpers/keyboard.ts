// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { device } from 'detox';
import { delay } from './waitFor';

/**
 * Dismisses the soft keyboard in a platform-agnostic way.
 * 
 * On Android, this uses device.pressBack() which is the standard way to 
 * dismiss the keyboard without triggering action buttons.
 * On iOS, the keyboard usually doesn't block interactions in the same way,
 * but this helper provides a consistent interface.
 */
export async function dismissKeyboard() {
    if (device.getPlatform() === 'android') {
        // Pressing back on Android dismisses the keyboard if it's open
        await device.pressBack();
        // Give the OS a moment to complete the animation
        await delay(500);
    }
}
