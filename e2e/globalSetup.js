const detox = require('detox/runners/jest/globalSetup');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async (config) => {
    console.log('[E2E Setup] Applying port forwarding via ADB...');
    try {
        const deviceId = 'R3CWA0K6XLN';

        // Apply specific port forwards (safe: overwrites existing entries)
        execSync(`adb -s ${deviceId} reverse tcp:8081 tcp:8081`); // Metro
        execSync(`adb -s ${deviceId} reverse tcp:9080 tcp:9080`); // Mock Server
        console.log('[E2E Setup] Port forwarding applied successfully to device', deviceId);
    } catch (e) {
        console.warn('[E2E Setup] Failed to apply adb reverse.', e.message);
    }

    console.log('[E2E Setup] Calling original Detox setup...');
    try {
        await detox(config);
        console.log('[E2E Setup] Original Detox setup complete.');
    } catch (e) {
        console.error('[E2E Setup] Original Detox setup FAILED:', e);
        throw e;
    }

    console.log('[E2E Setup] Starting mock server...');
    const server = spawn('node', ['e2e/helpers/mockServer.js'], {
        detached: true,
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    fs.writeFileSync(path.join(__dirname, '.mock_server.pid'), server.pid.toString());
    server.unref();

    console.log('[E2E Setup] Waiting for mock server to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
};
