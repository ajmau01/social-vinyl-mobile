import * as SecureStore from 'expo-secure-store';
// Mock logger before importing storage
jest.mock('../logger', () => ({
    logger: {
        error: jest.fn()
    }
}));

import { secureStorage } from '../storage';

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

describe('secureStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('saves the auth token', async () => {
        await secureStorage.saveAuthToken('test-token');
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'test-token');
    });

    it('retrieves the auth token', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
        const token = await secureStorage.getAuthToken();
        expect(token).toBe('test-token');
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('returns null if token retrieval fails', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Fail'));
        const token = await secureStorage.getAuthToken();
        expect(token).toBeNull();
    });

    it('deletes the auth token', async () => {
        await secureStorage.deleteAuthToken();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('saves session credentials', async () => {
        await secureStorage.saveSessionCredentials('id', 'secret');
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('session_id', 'id');
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('session_secret', 'secret');
    });

    it('retrieves session credentials', async () => {
        (SecureStore.getItemAsync as jest.Mock)
            .mockResolvedValueOnce('id')
            .mockResolvedValueOnce('secret');
        const credentials = await secureStorage.getSessionCredentials();
        expect(credentials).toEqual({ sessionId: 'id', sessionSecret: 'secret' });
    });

    it('deletes session credentials', async () => {
        await secureStorage.deleteSessionCredentials();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_id');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_secret');
    });
});
