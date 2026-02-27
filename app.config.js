export default {
    expo: {
        name: "social-vinyl-mobile",
        slug: "social-vinyl-mobile",
        version: "1.0.0",
        // Note: orientation, icon, splash, ios, android, plugins are intentionally
        // omitted here. This project uses the bare workflow (android/ directory checked in).
        // Those native properties were applied via expo prebuild and live in the native
        // directories. EAS Build uses the existing android/ directory directly.
        // scheme IS included here — Expo Router needs it at JS runtime for deep linking,
        // even though the native intent-filter already lives in android/AndroidManifest.xml.
        scheme: "socialvinyl",
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        experiments: {
            typedRoutes: true
        },
        extra: {
            // Environment-based configuration (Issue #66)
            apiUrl: process.env.API_URL || 'http://localhost:9080',
            wsUrl: process.env.WS_URL || 'ws://localhost:9080/ws/listening-bin',
            debugWs: process.env.DEBUG_WS === 'true',
            sentryDsn: process.env.SENTRY_DSN || null,
            // Security flags
            sslPinningEnabled: process.env.SSL_PINNING_ENABLED === 'true',
            useMessageAuth: process.env.USE_MESSAGE_AUTH === 'true',
            eas: {
                projectId: 'ed2b880b-2dd6-4815-b52d-c213818f4e45'
            }
        }
    }
};
