// Mock expo-constants for Jest tests
jest.mock('expo-constants', () => ({
    __esModule: true,
    default: {
        expoConfig: {
            extra: {
                apiUrl: 'http://localhost:9080',
                wsUrl: 'ws://localhost:9080/ws/listening-bin',
                debugWs: false,
            }
        }
    }
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => ({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn(),
    })),
}));

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
    EventEmitter: jest.fn(() => ({
        addListener: jest.fn(),
        removeListeners: jest.fn(),
    })),
    ProxyNativeModule: {},
}));

export { };
