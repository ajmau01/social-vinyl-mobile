const detox = require('detox/runners/jest/globalTeardown');
const fs = require('fs');
const path = require('path');

module.exports = async (config) => {
    console.log('[E2E Teardown] Stopping mock server...');
    const pidFile = path.join(__dirname, '.mock_server.pid');
    if (fs.existsSync(pidFile)) {
        const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
        try {
            // Kill the process group to ensure any children are also killed
            process.kill(-pid, 'SIGINT');
        } catch (e) {
            try { process.kill(pid, 'SIGINT'); } catch (err) { /* ignore */ }
        }
        fs.unlinkSync(pidFile);
        console.log('[E2E Teardown] Mock server stopped.');
    }

    // Call original Detox teardown
    await detox(config);
};
