export default {
    expo: {
        name: "social-vinyl-mobile",
        slug: "social-vinyl-mobile",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "socialvinyl",
        userInterfaceStyle: "automatic",
        splash: {
            image: "./assets/images/splash.png",
            resizeMode: "contain",
            backgroundColor: "#0a0a0a"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.socialvinyl.mobile"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#0a0a0a"
            },
            package: "com.socialvinyl.mobile"
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-secure-store"
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            // Environment-based configuration (Issue #66)
            apiUrl: process.env.API_URL || 'https://toddler-verified-guys-democrat.trycloudflare.com',
            wsUrl: process.env.WS_URL || 'wss://toddler-verified-guys-democrat.trycloudflare.com/ws/listening-bin',
            debugWs: process.env.DEBUG_WS === 'true',
            sslPinningEnabled: process.env.SSL_PINNING_ENABLED === 'true',
            useMessageAuth: process.env.USE_MESSAGE_AUTH === 'true',
        }
    }
};
