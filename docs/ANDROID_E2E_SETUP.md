# Android E2E Framework Setup Guide

To run Detox E2E tests on Android, you need to set up the native Android environment on your Mac.

## 1. System Requirements

*   **Java Development Kit (JDK)**: Version **17** is required for modern React Native.
    ```bash
    # Check version
    java -version
    ```
    *If not installed, use `brew install openjdk@17`.*

*   **Android Studio**:
    1.  Download and install [Android Studio](https://developer.android.com/studio).
    2.  In **SDK Manager**, ensure you have:
        *   **Android SDK Platform 33** (or the version matching `.detoxrc.js`).
        *   **SDK Build-Tools**.
        *   **Android Emulator**.
        *   **SDK Platform-Tools**.

## 2. Environment Variables

Add the following to your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

Don't forget to `source ~/.zshrc` after saving.

## 3. Create the Emulator

Detox is configured to use a specific emulator. In Android Studio's **Device Manager**:
1.  Create a Virtual Device.
2.  Choose **Pixel 7** (or similar).
3.  Choose **API 33** (UpsideDownCake) system image.
4.  **IMPORTANT**: Name the AVD exactly `Pixel_7_API_33`.

## 4. Generate the Android Project

Since the `android/` folder is currently missing in the repo (common for Expo managed projects), you need to generate it locally:

```bash
npx expo prebuild --platform android
```

## 5. Build and Test

Once the environment is ready:

```bash
# 1. Start Metro with E2E flag (CRITICAL)
# Note: EXPO_PUBLIC_* env vars are required at Metro bundling time, 
# not just at build time.
EXPO_PUBLIC_E2E_MODE=true npx expo start --port 8081

# 2. Start the mock server (optional, globalSetup will start it automatically)
# node e2e/helpers/mockServer.js

# 3. Apply ADB reverse (Required for physical devices if not auto-applied)
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:9080 tcp:9080

# 4. Run the tests
npx detox test --configuration android.att.debug
```

## 6. Physical Device Setup (Samsung Galaxy etc.)

1.  **Enable Developer Options**: Go to Settings > About Phone > Software Info > Tap "Build Number" 7 times.
2.  **Enable USB Debugging**: In Settings > Developer Options, toggle **USB Debugging** on.
3.  **Connect over USB**: Authorize your Mac on the device prompt.
4.  **Verify Connection**:
    ```bash
    adb devices
    ```
5.  **Autofill Suppression**: The test suite uses `importantForAutofill="no"` to prevent 1Password/Bitwarden from blocking interaction.

## 7. Troubleshooting

### "Waiting for ready message from instrumentation"
- Ensure **Java 17** is the active JDK: `java -version`.
- Clean the build: `cd android && ./gradlew clean`.
- Ensure `DetoxTest.java` exists in your app's `androidTest` directory.

### "Mock server connection refused" (Port 9080)
- Verify Metro was started with `EXPO_PUBLIC_E2E_MODE=true`.
- Check if port 9080 is reversed: `adb reverse --list`.
- Restart ADB: `adb kill-server && adb start-server`.

### "Detox server closed gracefully" (Immediate exit)
- This often means the test runner couldn't connect to the app. Check that your Metro bundler is on port 8081 and accessible from the phone.
