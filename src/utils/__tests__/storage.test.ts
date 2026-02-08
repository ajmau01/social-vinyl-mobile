import { secureStorage } from '../storage';
import * as SecureStore from 'expo-secure-store';

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
});
