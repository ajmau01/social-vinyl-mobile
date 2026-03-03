// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { COPY } from '@/constants/copy';
import { validateUsername } from '@/utils/validation';
import { useSessionStore } from '@/store/useSessionStore';
import { useServices } from '@/contexts/ServiceContext';
import { useListeningBinStore } from '@/store/useListeningBinStore';

export default function AccountLoginScreen() {
    const router = useRouter();
    const { webSocketService, syncService } = useServices();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        const id = userId.trim();
        if (!validateUsername(id) || !password.trim()) {
            setError('Enter a valid username and password');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await webSocketService.login(id, password);
            if (result.success) {
                const { data } = result;
                const loggedInId = data.userId || id;
                const store = useSessionStore.getState();

                store.setAuthToken(data.token);
                store.setUsername(loggedInId);
                // @deprecated - retained strictly for auto-redirect routing in WelcomeScreen
                store.setLastMode('collector');

                if (data.sessionId) await store.setSessionId(String(data.sessionId));
                if (data.sessionSecret) await store.setSessionSecret(data.sessionSecret);
                if (data.joinCode) store.setJoinCode(data.joinCode);
                if (data.sessionName) store.setSessionName(data.sessionName);
                if (data.hostUsername) store.setHostUsername(data.hostUsername);
                if (data.isPermanent !== undefined) store.setIsPermanent(data.isPermanent);

                store.setSessionRole('host');
                store.setAvatarUrl(null); // Clear any stale voyeur avatar immediately
                store.setFamilyPassCode(null); // Clear guest family pass — not relevant in host mode
                useSessionStore.getState().setSyncStatus('syncing');
                useListeningBinStore.getState().clearBin();

                router.replace(data.sessionId ? '/(tabs)/bin' : '/');

                syncService.syncCollection(loggedInId, {
                    onProgress: (p) => useSessionStore.getState().setSyncProgress(p),
                    onStatusChange: (s) => useSessionStore.getState().setSyncStatus(s)
                }).then(syncResult => {
                    if (syncResult.success) {
                        if (syncResult.data.avatarUrl) {
                            useSessionStore.getState().setAvatarUrl(syncResult.data.avatarUrl);
                        }
                    } else {
                        console.error('[Login] Auto-sync failed:', syncResult.error);
                    }
                });
            } else {
                setError(result.error.message || 'Login failed');
            }
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>{COPY.SIGN_IN}</Text>
                        <Text style={styles.subtitle}>{COPY.HUB_HOST_TITLE}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Discogs Username</Text>
                            <TextInput
                                testID="login-input"
                                style={styles.input}
                                value={userId}
                                onChangeText={setUserId}
                                placeholder="e.g., ajmau"
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                testID="login-password"
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                placeholder="Enter password"
                                placeholderTextColor={THEME.colors.textMuted}
                            />
                        </View>

                        {error && <Text testID="login-error" style={styles.errorMsg}>{error}</Text>}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                testID="login-cancel"
                                style={styles.secondaryButton}
                                onPress={() => router.back()}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                testID="login-submit"
                                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Unlock</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.createAccountLink}
                            onPress={() => router.replace('/account-create')}
                            disabled={loading}
                        >
                            <Text style={styles.createAccountText}>
                                No account? <Text style={styles.createAccountAccent}>Sign up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: THEME.colors.textDim,
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    errorMsg: {
        color: THEME.colors.status.error,
        marginTop: 8,
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
    },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        minWidth: 120,
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    createAccountLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    createAccountText: {
        color: THEME.colors.textDim,
        fontSize: 14,
    },
    createAccountAccent: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
});
