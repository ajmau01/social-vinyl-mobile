import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

const PORT = 9080;

interface MockRelease {
    id: number;
    instanceId: number;
    title: string;
    artist: string;
    year: string;
    genres: string;
    thumb_url: string | null;
}

// Seed Data
const SEED_COLLECTION: MockRelease[] = [
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

export class MockBackendServer {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();

    start() {
        console.log(`[MockServer] Starting on port ${PORT}...`);
        this.wss = new WebSocketServer({ port: PORT, path: '/ws' });

        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            console.log('[MockServer] Client connected');
            this.clients.add(ws);

            // Extract auth token from URL if present (legacy support)
            const url = new URL(req.url || '', `http://localhost:${PORT}`);
            const token = url.searchParams.get('authToken');
            if (token) {
                console.log(`[MockServer] Client connected with token: ${token}`);
            }

            ws.on('message', (data: any) => {
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
    }

    stop() {
        console.log('[MockServer] Stopping...');
        this.clients.forEach(client => client.close());
        this.wss?.close();
        this.wss = null;
    }

    private handleMessage(ws: WebSocket, message: any) {
        switch (message.action || message.type) {
            case 'authenticate': // Legacy/Current action name
            case 'AUTH':
                this.handleLogin(ws, message);
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

    private handleLogin(ws: WebSocket, message: any) {
        if (message.username === 'testuser' || message.authToken === 'valid-token') {
            ws.send(JSON.stringify({
                type: 'login-success', // Or 'AUTH_SUCCESS' based on protocol
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

    private handleSync(ws: WebSocket, message: any) {
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
                        items: SEED_COLLECTION // If protocol sends items here, otherwise they might be fetched via REST
                    }
                }));

                // Note: Real app might fetch specific pages via REST. 
                // For E2E, if we rely on WS for sync data, this is fine.
                // If app uses REST for data, we need to mock that too. 
                // Assuming Hybrid: Sync status via WS, data via REST or WS.
                // Issue #60 example showed `collection-data` message.
                ws.send(JSON.stringify({
                    type: 'collection-data',
                    albums: SEED_COLLECTION
                }));
            }
        }, 100);
    }

    private handleCreateSession(ws: WebSocket) {
        ws.send(JSON.stringify({
            type: 'session-created',
            sessionId: 'new-session-123',
            joinCode: '1234'
        }));
    }
}

// Allow running standalone
// ESM compatible main module check
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new MockBackendServer();
    server.start();

    // Handle shutdown
    process.on('SIGINT', () => {
        server.stop();
        process.exit();
    });
}
