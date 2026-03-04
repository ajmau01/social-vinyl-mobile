// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function LinkDiscogsScreen() {
    const router = useRouter();
    const { error: callbackError } = useLocalSearchParams<{ error?: string }>();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const displayError = callbackError === 'callback_failed'
        ? 'Discogs authorization failed. Please try again.'
        : error;

    const handleLinkDiscogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/discogs-auth/init`);
            if (!res.ok) throw new Error('Server error starting Discogs authorization');
            const { authorizeUrl, oauthToken } = await res.json();
            useSessionStore.getState().setPendingOAuthToken(oauthToken);
            await Linking.openURL(authorizeUrl);
        } catch (e) {
            setError('Could not start Discogs authorization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.replace('/(tabs)/collection');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Link Discogs</Text>
                        <Text style={styles.subtitle}>
                            Connect your Discogs collection to start hosting listening parties.
                        </Text>

                        {displayError && (
                            <Text style={styles.errorMsg}>{displayError}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleLinkDiscogs}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.primaryButtonText}>Link Discogs Account</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            disabled={loading}
                        >
                            <Text style={styles.skipButtonText}>Skip for now</Text>
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
    skipButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipButtonText: {
        color: THEME.colors.textDim,
        fontSize: 14,
    },
});
