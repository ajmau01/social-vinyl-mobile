/**
 * Service Context for Dependency Injection
 * 
 * Provides a React Context for accessing services throughout the app.
 * Enables easy mocking in tests by allowing service overrides.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { IWebSocketService, ISyncService, IDatabaseService } from '@/services/interfaces';
import { wsService } from '@/services/WebSocketService';
import { syncService } from '@/services/CollectionSyncService';
import { dbService } from '@/services/DatabaseService';

/**
 * Service Context Value
 * Contains all injectable services
 */
export interface ServiceContextValue {
    webSocketService: IWebSocketService;
    syncService: ISyncService;
    databaseService: IDatabaseService;
}

/**
 * Service Provider Props
 * Allows optional service overrides for testing
 */
export interface ServiceProviderProps {
    children: React.ReactNode;
    webSocketService?: IWebSocketService;
    collectionSyncService?: ISyncService;
    databaseService?: IDatabaseService;
}

/**
 * Service Context
 * Provides services to the component tree
 */
export const ServiceContext = createContext<ServiceContextValue | null>(null);

ServiceContext.displayName = 'ServiceContext';

/**
 * Service Provider Component
 * Wraps the app to provide services via context
 * 
 * @example
 * // Production usage (uses real services)
 * <ServiceProvider>
 *   <App />
 * </ServiceProvider>
 * 
 * @example
 * // Test usage (injects mocks)
 * <ServiceProvider 
 *   webSocketService={mockWebSocketService}
 *   collectionSyncService={mockSyncService}
 * >
 *   <ComponentUnderTest />
 * </ServiceProvider>
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
    children,
    webSocketService = wsService,
    collectionSyncService = syncService,
    databaseService = dbService,
}) => {
    const value = useMemo<ServiceContextValue>(() => ({
        webSocketService,
        syncService: collectionSyncService,
        databaseService,
    }), [webSocketService, collectionSyncService, databaseService]);

    return (
        <ServiceContext.Provider value={value}>
            {children}
        </ServiceContext.Provider>
    );
};

ServiceProvider.displayName = 'ServiceProvider';

/**
 * Hook to access services from context
 * 
 * @throws Error if used outside ServiceProvider
 * @returns ServiceContextValue containing all services
 * 
 * @example
 * const { webSocketService, syncService, databaseService } = useServices();
 * await webSocketService.connect(username);
 */
export const useServices = (): ServiceContextValue => {
    const context = useContext(ServiceContext);

    if (!context) {
        throw new Error(
            'useServices must be used within a ServiceProvider. ' +
            'Wrap your app with <ServiceProvider> in _layout.tsx'
        );
    }

    return context;
};
