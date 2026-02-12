/** @type {Detox.DetoxConfig} */
module.exports = {
    testRunner: {
        args: {
            '$0': 'jest',
            config: 'e2e/jest.config.js'
        },
        jest: {
            setupTimeout: 120000
        }
    },
    apps: {
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build_detox/Build/Products/Debug-iphonesimulator/socialvinylmobile.app',
            // Note: EXPO_PUBLIC_E2E_MODE is required for Metro to bundle with E2E config.
            // E2E_MODE is used for backend/logic that isn't exposed via Expo public env.
            build: 'E2E_MODE=true EXPO_PUBLIC_E2E_MODE=true xcodebuild -workspace ios/socialvinylmobile.xcworkspace -scheme socialvinylmobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build_detox'
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/socialvinylmobile.app',
            build: 'xcodebuild -workspace ios/socialvinylmobile.xcworkspace -scheme socialvinylmobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
        },
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            // Note: EXPO_PUBLIC_E2E_MODE is required for Metro to bundle with E2E config.
            build: 'export JAVA_HOME=$(/usr/libexec/java_home -v 17) && E2E_MODE=true EXPO_PUBLIC_E2E_MODE=true cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
            // Port 8081: Metro, 9080: Mock Server, 8097: React DevTools/Profiler
            reversePorts: [8081, 9080, 8097]
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
            build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
        }
    },
    devices: {
        simulator: {
            type: 'ios.simulator',
            device: {
                type: 'iPhone SE (3rd generation)'
            }
        },
        emulator: {
            type: 'android.emulator',
            device: {
                avdName: 'Pixel_7_API_33'
            }
        },
        attached: {
            type: 'android.attached',
            device: {
                adbName: '.*' // Match any attached device
            }
        }
    },
    configurations: {
        'ios.sim.debug': {
            device: 'simulator',
            app: 'ios.debug'
        },
        'ios.sim.release': {
            device: 'simulator',
            app: 'ios.release'
        },
        'android.emu.debug': {
            device: 'emulator',
            app: 'android.debug'
        },
        'android.emu.release': {
            device: 'emulator',
            app: 'android.release'
        },
        'android.att.debug': {
            device: 'attached',
            app: 'android.debug'
        }
    }
};
