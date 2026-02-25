import { ISessionService } from './interfaces';
import { wsService } from './WebSocketService';
import { dbService } from './DatabaseService';
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

    public async createSession(name: string, permanent: boolean, mode?: 'party' | 'live' | 'solo'): Promise<AsyncResult<SessionCreatedMessage>> {
        return new Promise((resolve) => {
            const listener = (response: SessionCreatedMessage) => {
                wsService.removeListener('session-created', listener);

                // Store session context
                const store = useSessionStore.getState();
                store.setSessionId(response.sessionId);
                store.setSessionName(response.name);
                store.setJoinCode(response.joinCode);
                store.setSessionSecret(response.sessionSecret);
                store.setIsPermanent(permanent);
                store.setSessionRole('host');

                const resolvedMode = mode ?? (permanent ? 'live' : 'party');
                store.setSessionMode(resolvedMode);

                // Issue #154: Persist local history
                dbService.createSession({
                    id: String(response.sessionId),
                    session_name: response.name,
                    host_username: store.username || 'unknown',
                    started_at: Date.now(),
                    ended_at: null,
                    mode: resolvedMode,
                    guest_count: 0
                }).catch(err => logger.error('[SessionService] Failed to record session history', err));

                resolve({ success: true, data: response });
            };

            wsService.addListener('session-created', listener);

            setTimeout(() => {
                wsService.removeListener('session-created', listener);
                resolve({ success: false, error: new Error('create-session timed out') });
            }, 5000);

            wsService.sendAction('create-session', { name, permanent }).catch(error => {
                logger.error('[SessionService] createSession failed:', error.message || error);
                wsService.removeListener('session-created', listener);
                resolve({ success: false, error });
            });
        });
    }

    public async joinSession(code: string, name: string): Promise<AsyncResult<SessionJoinedMessage>> {
        return new Promise((resolve) => {
            const listener = (response: SessionJoinedMessage) => {
                wsService.removeListener('session-joined', listener);

                // Store session context
                const store = useSessionStore.getState();
                store.setSessionId(response.sessionId);
                store.setSessionName(response.name);
                store.setJoinCode(response.joinCode);
                store.setSessionSecret(response.sessionSecret);
                store.setHostUsername(response.hostUsername);
                store.setIsPermanent(response.isPermanent);

                // Determine role dynamically (Issue #142 Redesign V5.2)
                if (response.hostUsername && store.username && response.hostUsername.toLowerCase() === store.username.toLowerCase()) {
                    store.setSessionRole('host');
                } else {
                    store.setSessionRole('guest');
                }

                store.setDisplayName(name); // Ensure display name is saved

                // Issue #154: Persist local history
                dbService.createSession({
                    id: String(response.sessionId),
                    session_name: response.name,
                    host_username: response.hostUsername || 'unknown',
                    started_at: Date.now(),
                    ended_at: null,
                    mode: response.isPermanent ? 'live' : 'party',
                    guest_count: 0
                }).catch(err => logger.error('[SessionService] Failed to record session history', err));

                resolve({ success: true, data: response });
            };

            wsService.addListener('session-joined', listener);

            setTimeout(() => {
                wsService.removeListener('session-joined', listener);
                resolve({ success: false, error: new Error('join-session timed out') });
            }, 5000);

            const { authToken } = useSessionStore.getState();
            wsService.joinSession(code, name, authToken || undefined).then(result => {
                if (!result.success) {
                    wsService.removeListener('session-joined', listener);
                    resolve(result);
                }
            }).catch(error => {
                logger.error('[SessionService] joinSession failed:', error.message || error);
                wsService.removeListener('session-joined', listener);
                resolve({ success: false, error });
            });
        });
    }

    public async leaveSession(): Promise<AsyncResult<void>> {
        try {
            await wsService.sendAction('leave-session');

            // Clear session state logic can wait or we can call store.clearSession()
            // But we might want to keep some Auth tokens, just clearing session context
            const store = useSessionStore.getState();
            if (store.sessionId) {
                // Issue #154: Terminate local history record
                dbService.endSession(String(store.sessionId), Date.now())
                    .catch(err => logger.error('[SessionService] Failed to end session history', err));
            }

            store.setSessionId(null);
            store.setSessionSecret(null);
            store.setJoinCode(null);
            store.setSessionRole(null);
            store.setIsPermanent(false);
            store.setIsBroadcast(false);
            store.setSessionName(null);
            store.setHostUsername(null);
            store.setSessionMode(null);
            store.setNowPlaying(null);

            return { success: true, data: undefined };
        } catch (error: any) {
            logger.error('[SessionService] leaveSession failed:', error);
            return { success: false, error };
        }
    }

    public async archiveSession(sessionId: number): Promise<AsyncResult<void>> {
        try {
            // Sends the true 'archive-session' action which sets active=false on the backend.
            await wsService.sendAction('archive-session', { sessionId });

            // Clear local session if we ended our active one
            const store = useSessionStore.getState();
            if (store.sessionId === sessionId || store.sessionId === String(sessionId)) {
                // Issue #154: Terminate local history record
                dbService.endSession(String(store.sessionId), Date.now())
                    .catch(err => logger.error('[SessionService] Failed to end session history', err));

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
            logger.error('[SessionService] archiveSession failed:', error);
            return { success: false, error };
        }
    }

    public async getSessions(): Promise<ISessionCard[]> {
        return new Promise((resolve) => {
            let timeoutId: ReturnType<typeof setTimeout>;

            const listener = (data: any) => {
                clearTimeout(timeoutId);
                wsService.removeListener('session-list', listener);
                resolve(data.sessions || []);
            };

            wsService.addListener('session-list', listener);

            // Set a fallback timeout in case the server never responds
            timeoutId = setTimeout(() => {
                wsService.removeListener('session-list', listener);
                resolve([]);
            }, 5000);

            wsService.sendAction('get-sessions').catch(error => {
                logger.error('[SessionService] sendAction(get-sessions) failed:', error.message || error);
            });
        });
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
