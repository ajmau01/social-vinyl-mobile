import { ISessionService } from './interfaces';
import { wsService } from './WebSocketService';
import { useSessionStore } from '@/store/useSessionStore';
import {
    AsyncResult,
    SessionCreatedMessage,
    SessionJoinedMessage,
    SessionListMessage,
    SessionCard as ISessionCard
} from '@/types';
import { logger } from '@/utils/logger';

export class SessionService implements ISessionService {

    public async createSession(name: string, permanent: boolean): Promise<AsyncResult<SessionCreatedMessage>> {
        try {
            const response = await wsService.sendAction<SessionCreatedMessage>('create-session', { name, permanent });

            // Store session context
            const store = useSessionStore.getState();
            store.setSessionId(response.sessionId);
            store.setSessionName(response.name);
            store.setJoinCode(response.joinCode);
            store.setSessionSecret(response.sessionSecret);
            store.setIsPermanent(permanent);
            store.setSessionRole('host');

            return { success: true, data: response };
        } catch (error: any) {
            logger.error('[SessionService] createSession failed:', error);
            return { success: false, error };
        }
    }

    public async joinSession(code: string, name: string): Promise<AsyncResult<SessionJoinedMessage>> {
        try {
            const response = await wsService.sendAction<SessionJoinedMessage>('join-session', { joinCode: code, username: name });

            // Store session context
            const store = useSessionStore.getState();
            store.setSessionId(response.sessionId);
            store.setSessionName(response.name);
            store.setJoinCode(response.joinCode);
            store.setSessionSecret(response.sessionSecret);
            store.setHostUsername(response.hostUsername);
            store.setIsPermanent(response.isPermanent);
            store.setSessionRole('guest'); // Could be voyeur depending on logic, but default to guest
            store.setDisplayName(name); // Ensure display name is saved

            return { success: true, data: response };
        } catch (error: any) {
            logger.error('[SessionService] joinSession failed:', error);
            return { success: false, error };
        }
    }

    public async leaveSession(): Promise<AsyncResult<void>> {
        try {
            await wsService.sendAction('leave-session');

            // Clear session state logic can wait or we can call store.clearSession()
            // But we might want to keep some Auth tokens, just clearing session context
            const store = useSessionStore.getState();
            store.setSessionId(null);
            store.setSessionSecret(null);
            store.setJoinCode(null);
            store.setSessionRole(null);
            store.setIsPermanent(false);
            store.setIsBroadcast(false);
            store.setSessionName(null);
            store.setHostUsername(null);

            return { success: true, data: undefined };
        } catch (error: any) {
            logger.error('[SessionService] leaveSession failed:', error);
            return { success: false, error };
        }
    }

    public async archiveSession(sessionId: number): Promise<AsyncResult<void>> {
        try {
            await wsService.sendAction('archive-session', { sessionId });

            // Clear local session if we ended our active one
            const store = useSessionStore.getState();
            if (store.sessionId === sessionId || store.sessionId === String(sessionId)) {
                store.setSessionId(null);
                store.setSessionSecret(null);
                store.setJoinCode(null);
                store.setSessionRole(null);
                store.setIsPermanent(false);
                store.setIsBroadcast(false);
                store.setSessionName(null);
            }
            return { success: true, data: undefined };
        } catch (error: any) {
            logger.error('[SessionService] endSession failed:', error);
            return { success: false, error };
        }
    }

    public async getSessions(): Promise<ISessionCard[]> {
        try {
            const response = await wsService.sendAction<SessionListMessage>('get-sessions');
            return response.sessions || [];
        } catch (error: any) {
            logger.error('[SessionService] getSessions failed:', error);
            return [];
        }
    }

    public async setBroadcast(sessionId: number): Promise<AsyncResult<void>> {
        try {
            await wsService.sendAction('set-broadcast', { sessionId });
            // Let the state update push the change through WS STATE messages,
            // or eagerly update UI state here if desired
            return { success: true, data: undefined };
        } catch (error: any) {
            logger.error('[SessionService] setBroadcast failed:', error);
            return { success: false, error };
        }
    }

    public setDisplayName(name: string): void {
        const store = useSessionStore.getState();
        store.setDisplayName(name);
        // Persisted via zustand partialize automatically
    }
}

export const sessionService = new SessionService();
