// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { CONFIG } from '@/config';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { email, setEmailVerified } = useSessionStore(
        useShallow(state => ({ email: state.email, setEmailVerified: state.setEmailVerified }))
    );

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRef = useRef<TextInput>(null);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const handleCodeChange = (value: string) => {
        const numeric = value.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(numeric);
        setError(null);
        if (numeric.length === 6) {
            submitCode(numeric);
        }
    };

    const submitCode = async (codeToSubmit: string) => {
        if (!email) {
            setError('No email address found. Please register again.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: codeToSubmit }),
            });
            const data = await res.json();
            if (data.verified) {
                setEmailVerified(true);
                router.replace('/link-discogs');
            } else {
                const msg = data.error === 'code_expired'
                    ? 'Code expired. Please request a new one.'
                    : 'Incorrect code. Please try again.';
                setError(msg);
                setCode('');
            }
        } catch {
            setError('Could not reach the server. Please try again.');
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || !email) return;
        try {
            await fetch(`${CONFIG.API_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
        } catch {
            // Ignore fetch errors — always start cooldown
        }
        setResendCooldown(30);
        setError(null);
        setCode('');
        cooldownRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Verify your email</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code sent to{'\n'}
                            <Text style={styles.emailText}>{email ?? 'your email'}</Text>
                        </Text>

                        <TextInput
                            ref={inputRef}
                            style={[styles.otpInput, error ? styles.otpInputError : null]}
                            value={code}
                            onChangeText={handleCodeChange}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="000000"
                            placeholderTextColor={THEME.colors.textMuted}
                            editable={!loading}
                            textAlign="center"
                        />

                        {error && <Text style={styles.errorMsg}>{error}</Text>}

                        {loading && (
                            <ActivityIndicator
                                color={THEME.colors.primary}
                                style={{ marginTop: 16 }}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={handleResend}
                            disabled={resendCooldown > 0}
                        >
                            <Text style={[
                                styles.resendText,
                                resendCooldown > 0 && styles.resendTextDisabled
                            ]}>
                                {resendCooldown > 0
                                    ? `Resend code in ${resendCooldown}s`
                                    : 'Resend code'
                                }
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
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    emailText: {
        color: '#fff',
        fontWeight: '600',
    },
    otpInput: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        letterSpacing: 8,
    },
    otpInputError: {
        borderColor: THEME.colors.status.error,
    },
    errorMsg: {
        color: THEME.colors.status.error,
        marginTop: 12,
        textAlign: 'center',
    },
    resendButton: {
        marginTop: 32,
        padding: 8,
    },
    resendText: {
        color: THEME.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    resendTextDisabled: {
        color: THEME.colors.textMuted,
    },
});
