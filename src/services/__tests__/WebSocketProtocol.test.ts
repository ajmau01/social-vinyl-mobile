// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { wsService } from '../WebSocketService';
import { useSessionStore } from '../../store/useSessionStore';

// Manual Mock Approach
describe('WebSocketService Protocol Logic', () => {
    let mockSocket: any;

    beforeEach(() => {
        jest.useFakeTimers();
        useSessionStore.setState({ enabledFeatures: [] });

        mockSocket = {
            send: jest.fn(),
            close: jest.fn(),
            readyState: 1 // OPEN
        };

        // Inject mock socket (we might need to expose a setter or use 'any')
        (wsService as any).socket = mockSocket;
        (wsService as any).pendingActions = new Map();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('sets enabledFeatures when PROTOCOL_ACK is received', () => {
        const ackMsg = {
            type: 'PROTOCOL_ACK',
            supported: true,
            enabledFeatures: ['bin_sync', 'voice_chat']
        };

        const event = { data: JSON.stringify(ackMsg) } as MessageEvent;
        (wsService as any).handleMessage(event);

        const features = useSessionStore.getState().enabledFeatures;
        expect(features).toContain('bin_sync');
        expect(features).toContain('voice_chat');
    });

    it('resolves sendAction promise when ACTION_ACK is received', async () => {
        const promise = wsService.sendAction('add_track', { id: 123 });

        // Extract the actionId from the sent message
        const sentCall = mockSocket.send.mock.calls[0][0];
        const sentData = JSON.parse(sentCall);
        expect(sentData.type).toBe('CLIENT_ACTION');
        const actionId = sentData.actionId;

        // Simulate ACK
        const ackMsg = {
            type: 'ACTION_ACK',
            actionId: actionId,
            status: 'success',
            data: { confirm: true }
        };

        (wsService as any).handleMessage({ data: JSON.stringify(ackMsg) } as MessageEvent);

        const result = await promise;
        expect(result).toEqual({ confirm: true });
    });

    it('rejects sendAction promise when ACTION_ACK returns error', async () => {
        const promise = wsService.sendAction('add_track', { id: 123 });

        const sentCall = mockSocket.send.mock.calls[0][0];
        const actionId = JSON.parse(sentCall).actionId;

        const ackMsg = {
            type: 'ACTION_ACK',
            actionId: actionId,
            status: 'error',
            error: 'Track not found'
        };

        (wsService as any).handleMessage({ data: JSON.stringify(ackMsg) } as MessageEvent);

        await expect(promise).rejects.toThrow('Track not found');
    });

    it('rejects sendAction on timeout', async () => {
        const promise = wsService.sendAction('slow_action', {});

        // Fast forward time
        jest.advanceTimersByTime(5001);

        await expect(promise).rejects.toThrow(/timed out/);
    });
});
