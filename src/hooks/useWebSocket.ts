import { useState, useEffect, useCallback } from 'react';
import { wsService } from '@/services/WebSocketService';
import { ConnectionState } from '@/types';

/**
 * useWebSocketStatus Hook
 * 
 * Provides reactive access to the WebSocket connection state.
 */
export const useWebSocketStatus = () => {
    const [status, setStatus] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const callbacks = {
            onConnectionStateChange: (newState: ConnectionState) => {
                setStatus(newState);
                if (newState === 'connected') {
                    setError(null);
                }
            },
            onMessage: () => { }, // Handled by other listeners if needed
            onError: (err: Error) => {
                setError(err);
                setStatus('disconnected');
            }
        };

        wsService.setCallbacks(callbacks);

        return () => {
            // We don't want to clear callbacks here if multiple hooks use it,
            // but for now, this is the primary way to track state.
            // In a more complex app, this might be handled by a Context or Store.
        };
    }, []);

    const reconnect = useCallback(() => {
        // Implementation depends on how we want to expose reconnection logic.
        // For now, we just reset error and let the service handle it if it's in reconnecting mode.
        setError(null);
    }, []);

    return {
        status,
        error,
        reconnect,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting' || status === 'reconnecting'
    };
};
