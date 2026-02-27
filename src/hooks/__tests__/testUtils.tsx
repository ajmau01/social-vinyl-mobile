// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { ServiceProvider } from '@/contexts/ServiceContext';

/**
 * Test wrapper that provides ServiceProvider context for hooks
 */
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return <ServiceProvider>{children}</ServiceProvider>;
};


describe('testUtils', () => {
    it('is a utility file', () => {
        expect(true).toBe(true);
    });
});
