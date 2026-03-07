// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/useSessionStore';
import { useServices } from '@/contexts/ServiceContext';
import { validateUsername } from '@/utils/validation';
import { useListeningBinStore } from '@/store/useListeningBinStore';

export default function AccountCreateScreen() {
    const router = useRouter();
    const { webSocketService, syncService } = useServices();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tosAccepted, setTosAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

    const validateUsernameInput = (value: string) => {
        if (!value.trim()) return 'Username is required';
        if (!validateUsername(value)) return COPY.USERNAME_HINT;
        return null;
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return null;
    };

    const isSubmitDisabled =
        loading ||
        !!usernameError ||
        !!emailError ||
        !!passwordError ||
        !!confirmPasswordError ||
        !username.trim() ||
        !email.trim() ||
        !password ||
        !confirmPassword ||
        !tosAccepted;

    const handleRegister = async () => {
        // Final validation pass
        const uErr = validateUsernameInput(username.trim());
        const eErr = validateEmail(email.trim());
        const pErr = password.length < 8 ? COPY.PASSWORD_HINT : null;
        const cErr = password !== confirmPassword ? 'Passwords do not match' : null;

        setUsernameError(uErr);
        setEmailError(eErr);
        setPasswordError(pErr);
        setConfirmPasswordError(cErr);

        if (uErr || eErr || pErr || cErr) return;

        setLoading(true);
        setError(null);
        try {
            const result = await webSocketService.register(username.trim().toLowerCase(), password, email.trim());
            if (result.success) {
                const { data } = result;
                const loggedInId = data.userId || username.trim().toLowerCase();
                const store = useSessionStore.getState();

                store.setAuthToken(data.token);
                store.setUsername(loggedInId);
                store.setEmail(email.trim());

                if (data.sessionId) await store.setSessionId(String(data.sessionId));
                if (data.sessionSecret) await store.setSessionSecret(data.sessionSecret);
                if (data.joinCode) store.setJoinCode(data.joinCode);
                if (data.sessionName) store.setSessionName(data.sessionName);
                if (data.hostUsername) store.setHostUsername(data.hostUsername);
                if (data.isPermanent !== undefined) store.setIsPermanent(data.isPermanent);

                store.setSessionRole('host');
                store.setAvatarUrl(null);
                store.setFamilyPassCode(null);
                useSessionStore.getState().setSyncStatus('syncing');
                useListeningBinStore.getState().clearBin();

                router.replace('/verify-email');

                syncService.syncCollection(loggedInId, {
                    onProgress: (p) => useSessionStore.getState().setSyncProgress(p),
                    onStatusChange: (s) => useSessionStore.getState().setSyncStatus(s)
                }).then(syncResult => {
                    if (syncResult.success && syncResult.data.avatarUrl) {
                        useSessionStore.getState().setAvatarUrl(syncResult.data.avatarUrl);
                    }
                });
            } else {
                setError(result.error.message || 'Registration failed');
            }
        } catch (e: any) {
            setError(e.message || 'Registration failed');
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
                        <Text style={styles.title}>{COPY.CREATE_HOST_ACCOUNT}</Text>
                        <Text style={styles.subtitle}>Create your Social Vinyl host account.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={[styles.input, usernameError ? styles.inputError : null]}
                                value={username}
                                onChangeText={(v) => {
                                    setUsername(v);
                                    setUsernameError(validateUsernameInput(v));
                                }}
                                placeholder={COPY.USERNAME_PLACEHOLDER}
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={30}
                            />
                            {usernameError
                                ? <Text style={styles.fieldError}>{usernameError}</Text>
                                : <Text style={styles.hint}>{COPY.USERNAME_HINT}</Text>
                            }
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, emailError ? styles.inputError : null]}
                                value={email}
                                onChangeText={(v) => {
                                    setEmail(v);
                                    setEmailError(validateEmail(v));
                                }}
                                onBlur={() => setEmailError(validateEmail(email))}
                                placeholder="your@email.com"
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                            {emailError
                                ? <Text style={styles.fieldError}>{emailError}</Text>
                                : <Text style={styles.hint}>Used for account verification</Text>
                            }
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={[styles.input, passwordError ? styles.inputError : null]}
                                value={password}
                                onChangeText={(v) => {
                                    setPassword(v);
                                    if (passwordError) setPasswordError(v.length < 8 ? COPY.PASSWORD_HINT : null);
                                }}
                                onBlur={() => setPasswordError(password.length < 8 ? COPY.PASSWORD_HINT : null)}
                                secureTextEntry
                                autoCapitalize="none"
                                placeholder="Enter password"
                                placeholderTextColor={THEME.colors.textMuted}
                            />
                            {passwordError
                                ? <Text style={styles.fieldError}>{passwordError}</Text>
                                : <Text style={styles.hint}>{COPY.PASSWORD_HINT}</Text>
                            }
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{COPY.CONFIRM_PASSWORD_LABEL}</Text>
                            <TextInput
                                style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                                value={confirmPassword}
                                onChangeText={(v) => {
                                    setConfirmPassword(v);
                                    if (confirmPasswordError) setConfirmPasswordError(v !== password ? 'Passwords do not match' : null);
                                }}
                                onBlur={() => setConfirmPasswordError(confirmPassword !== password ? 'Passwords do not match' : null)}
                                secureTextEntry
                                autoCapitalize="none"
                                placeholder="Re-enter password"
                                placeholderTextColor={THEME.colors.textMuted}
                            />
                            {confirmPasswordError && <Text style={styles.fieldError}>{confirmPasswordError}</Text>}
                        </View>

                        <View style={styles.tosRow}>
                            <TouchableOpacity
                                onPress={() => setTosAccepted(!tosAccepted)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, tosAccepted && styles.checkboxChecked]}>
                                    {tosAccepted && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.tosText}>
                                I agree to the{' '}
                                <Text
                                    style={styles.tosLink}
                                    onPress={() => router.push('/tos')}
                                >
                                    Terms of Service
                                </Text>
                            </Text>
                        </View>

                        {error && <Text style={styles.errorMsg}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isSubmitDisabled}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signInLink}
                            onPress={() => router.push('/account-login')}
                            disabled={loading}
                        >
                            <Text style={styles.signInLinkText}>
                                {COPY.ALREADY_HAVE_ACCOUNT} <Text style={styles.signInLinkAccent}>Sign In</Text>
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
    inputError: {
        borderColor: THEME.colors.status.error,
    },
    hint: {
        color: THEME.colors.textMuted,
        fontSize: 12,
        marginTop: 6,
    },
    fieldError: {
        color: THEME.colors.status.error,
        fontSize: 12,
        marginTop: 6,
    },
    tosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tosText: {
        color: THEME.colors.textDim,
        fontSize: 14,
        flex: 1,
    },
    tosLink: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    errorMsg: {
        color: THEME.colors.status.error,
        marginBottom: 16,
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signInLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    signInLinkText: {
        color: THEME.colors.textDim,
        fontSize: 14,
    },
    signInLinkAccent: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
});
