// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CONFIG } from '@/config';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(emailParam ?? '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async () => {
        if (!email.trim() || !code.trim()) {
            setError('Email and code are required');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code: code.trim(),
                    newPassword
                }),
            });
            const data = await res.json();
            if (data.reset) {
                router.replace('/account-login?reset=success');
            } else {
                const msg = data.error === 'code_expired'
                    ? 'Code expired. Please request a new one.'
                    : 'Invalid reset code. Please check and try again.';
                setError(msg);
            }
        } catch {
            setError('Could not reach the server. Please try again.');
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
                        <Text style={styles.title}>Set new password</Text>
                        <Text style={styles.subtitle}>Enter the code from your email and your new password.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Reset code</Text>
                            <TextInput
                                style={styles.input}
                                value={code}
                                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="6-digit code"
                                placeholderTextColor={THEME.colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New password</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                placeholder="At least 8 characters"
                                placeholderTextColor={THEME.colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm new password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                placeholder="Re-enter new password"
                                placeholderTextColor={THEME.colors.textMuted}
                            />
                        </View>

                        {error && <Text style={styles.errorMsg}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleReset}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.primaryButtonText}>Reset password</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryLink}
                            onPress={() => router.replace('/forgot-password')}
                        >
                            <Text style={styles.secondaryLinkText}>Get a new reset code</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 16, color: THEME.colors.textDim, marginBottom: 32 },
    inputGroup: { marginBottom: 20 },
    label: { color: THEME.colors.textDim, fontSize: 14, marginBottom: 8 },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    errorMsg: { color: THEME.colors.status.error, marginBottom: 16, textAlign: 'center' },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonDisabled: { opacity: 0.5 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryLink: { marginTop: 24, alignItems: 'center' },
    secondaryLinkText: { color: THEME.colors.textDim, fontSize: 14 },
});
