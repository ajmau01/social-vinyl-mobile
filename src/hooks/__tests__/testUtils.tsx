import React from 'react';
import { ServiceProvider } from '@/contexts/ServiceContext';

/**
 * Test wrapper that provides ServiceProvider context for hooks
 */
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return <ServiceProvider>{children}</ServiceProvider>;
};
