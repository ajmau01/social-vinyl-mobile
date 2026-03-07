// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CONFIG } from '@/config';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmed = email.trim();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError('Please enter a valid email address');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await fetch(`${CONFIG.API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
        } catch {
            // Ignore fetch errors — always show success state
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.subtitle}>
                        If that email is registered, you'll receive a reset code shortly.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
                    >
                        <Text style={styles.primaryButtonText}>Enter reset code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryLink}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryLinkText}>Back to sign in</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Reset password</Text>
                        <Text style={styles.subtitle}>Enter your email and we'll send a reset code.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, error ? styles.inputError : null]}
                                value={email}
                                onChangeText={(v) => { setEmail(v); setError(null); }}
                                placeholder="your@email.com"
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                            {error && <Text style={styles.fieldError}>{error}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.primaryButtonText}>Send reset code</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryLink} onPress={() => router.back()}>
                            <Text style={styles.secondaryLinkText}>Back to sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
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
    inputError: { borderColor: THEME.colors.status.error },
    fieldError: { color: THEME.colors.status.error, fontSize: 12, marginTop: 6 },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        alignSelf: 'stretch',
        marginTop: 8,
    },
    primaryButtonDisabled: { opacity: 0.5 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryLink: { marginTop: 24, alignItems: 'center' },
    secondaryLinkText: { color: THEME.colors.textDim, fontSize: 14 },
});
