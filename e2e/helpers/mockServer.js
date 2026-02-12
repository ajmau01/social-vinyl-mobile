const { WebSocketServer, WebSocket } = require('ws');
const { createServer } = require('http');

const PORT = 9080;

// Seed Data
const SEED_COLLECTION = [
    {
        id: 101,
        instanceId: 1001,
        title: 'Thriller',
        artist: 'Michael Jackson',
        year: '1982',
        genres: 'Pop, R&B',
        thumb_url: 'https://example.com/thriller.jpg'
    },
    {
        id: 102,
        instanceId: 1002,
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        year: '1973',
        genres: 'Rock, Progressive Rock',
        thumb_url: 'https://example.com/dsotm.jpg'
    },
    {
        id: 103,
        instanceId: 1003,
        title: 'Rumours',
        artist: 'Fleetwood Mac',
        year: '1977',
        genres: 'Rock, Pop',
        thumb_url: 'https://example.com/rumours.jpg'
    },
    {
        id: 104,
        instanceId: 1004,
        title: 'Café de Paris',
        artist: 'Various Artists',
        year: '2005',
        genres: 'Jazz, Lounge',
        thumb_url: null
    },
    {
        id: 105,
        instanceId: 1005,
        title: 'El Señor de los Anillos',
        artist: 'Howard Shore',
        year: '2001',
        genres: 'Soundtrack, Classical',
        thumb_url: null
    }
];

class MockBackendServer {
    constructor() {
        this.wss = null;
        this.server = null;
        this.clients = new Set();
    }

    start() {
        console.log(`[MockServer] Starting on port ${PORT}...`);

        this.server = createServer((req, res) => {
            const url = new URL(req.url || '', `http://localhost:${PORT}`);

            if (url.pathname === '/collection' && req.method === 'GET') {
                this.handleHttpRequest(req, res, url);
                return;
            }

            res.statusCode = 404;
            res.end('Not Found');
        });

        this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

        this.wss.on('connection', (ws, req) => {
            console.log('[MockServer] Client connected');
            this.clients.add(ws);

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('[MockServer] Received:', message.type || message.action);
                    this.handleMessage(ws, message);
                } catch (e) {
                    console.error('[MockServer] Error parsing message:', e);
                }
            });

            ws.on('close', () => {
                console.log('[MockServer] Client disconnected');
                this.clients.delete(ws);
            });

            // Send WELCOME message immediately
            ws.send(JSON.stringify({ type: 'WELCOME', message: 'Welcome to Social Vinyl Mock Server' }));
        });

        this.server.listen(PORT, () => {
            console.log(`[MockServer] Server listening on http://localhost:${PORT}`);
        });
    }

    handleHttpRequest(req, res, url) {
        console.log(`[MockServer] HTTP ${req.method} ${req.url}`);

        const username = url.searchParams.get('username') || 'mock-user';

        // Group by primary genre for the response
        const grouped = {};
        SEED_COLLECTION.forEach(r => {
            const primaryGenre = r.genres.split(',')[0].trim();
            if (!grouped[primaryGenre]) grouped[primaryGenre] = [];
            grouped[primaryGenre].push(r);
        });

        const responseData = {
            username,
            albums: grouped,
            avatarUrl: 'https://example.com/avatar.jpg'
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(responseData));
    }

    stop() {
        console.log('[MockServer] Stopping...');
        this.clients.forEach(client => client.close());
        this.wss?.close();
        this.server?.close();
        this.wss = null;
        this.server = null;
    }

    handleMessage(ws, message) {
        switch (message.action || message.type) {
            case 'authenticate': // Legacy/Current action name
            case 'AUTH':
                this.handleLogin(ws, message);
                break;

            case 'admin-login':
                this.handleAdminLogin(ws, message);
                break;

            case 'sync-collection':
            case 'SYNC':
                this.handleSync(ws, message);
                break;

            case 'create-session':
                this.handleCreateSession(ws);
                break;

            default:
                console.log(`[MockServer] Unhandled message type: ${message.action || message.type}`);
        }
    }

    handleLogin(ws, message) {
        if (message.username === 'testuser' || message.authToken === 'valid-token') {
            ws.send(JSON.stringify({
                type: 'login-success',
                success: true,
                sessionId: 'mock-session-id',
                token: 'mock-jwt-token',
                userId: 'user-123'
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid credentials'
            }));
        }
    }

    handleAdminLogin(ws, message) {
        console.log(`[MockServer] Admin Login request for: ${message.userId || message.username}`);

        if (message.username === 'wrong_user' || message.password === 'wrong_pass') {
            const response = {
                type: 'error',
                message: 'Invalid credentials'
            };
            ws.send(JSON.stringify(response));
            return;
        }

        // Simulate success
        const response = {
            type: 'admin-login-success',
            messageType: 'admin-login-success',
            sessionId: 'mock-session-id',
            authToken: 'mock-auth-token',
            username: message.userId || message.username || 'mock-admin'
        };
        ws.send(JSON.stringify(response));
    }

    handleSync(ws, message) {
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            ws.send(JSON.stringify({
                type: 'sync-progress',
                progress: progress
            }));

            if (progress >= 100) {
                clearInterval(interval);
                // Send completion with data
                ws.send(JSON.stringify({
                    type: 'sync-complete',
                    payload: {
                        itemCount: SEED_COLLECTION.length,
                        items: SEED_COLLECTION
                    }
                }));

                ws.send(JSON.stringify({
                    type: 'collection-data',
                    albums: SEED_COLLECTION
                }));
            }
        }, 100);
    }

    handleCreateSession(ws) {
        ws.send(JSON.stringify({
            type: 'session-created',
            sessionId: 'new-session-123',
            joinCode: '1234'
        }));
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    const server = new MockBackendServer();
    server.start();
}

module.exports = { MockBackendServer };
