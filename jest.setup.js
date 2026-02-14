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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
    EventEmitter: jest.fn(() => ({
        addListener: jest.fn(),
        removeListeners: jest.fn(),
    })),
    ProxyNativeModule: {},
    requireNativeModule: jest.fn(() => ({})),
}));

// Mock Reanimated
require('react-native-reanimated/mock');

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: ({ children, style }) => <View style={style}>{children}</View>,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    ImpactFeedbackStyle: { Medium: 'medium' },
    NotificationFeedbackType: { Success: 'success' },
}));

export { };
