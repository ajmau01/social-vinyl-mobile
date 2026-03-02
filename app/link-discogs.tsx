// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useServices } from '@/contexts/ServiceContext';

const DISCOGS_DEVELOPERS_URL = 'https://www.discogs.com/settings/developers';

export default function LinkDiscogsScreen() {
    const router = useRouter();
    const { webSocketService, syncService } = useServices();

    const [discogsUsername, setDiscogsUsername] = useState('');
    const [discogsToken, setDiscogsToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSubmitDisabled = loading || !discogsUsername.trim() || !discogsToken.trim();

    const handleLink = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await webSocketService.linkDiscogs(discogsUsername.trim(), discogsToken.trim());
            if (result.success) {
                const store = useSessionStore.getState();
                store.setDiscogsLinked(true);
                store.setDiscogsUsername(result.data.discogsUsername);
                if (result.data.avatarUrl) store.setAvatarUrl(result.data.avatarUrl);

                const username = store.username;
                if (username) {
                    syncService.syncCollection(username, {
                        onProgress: (p) => useSessionStore.getState().setSyncProgress(p),
                        onStatusChange: (s) => useSessionStore.getState().setSyncStatus(s)
                    }).then(syncResult => {
                        if (syncResult.success && syncResult.data.avatarUrl) {
                            useSessionStore.getState().setAvatarUrl(syncResult.data.avatarUrl);
                        }
                    });
                }

                router.replace('/(tabs)/collection');
            } else {
                setError(result.error.message || 'Failed to link Discogs account');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to link Discogs account');
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Discogs Username</Text>
                            <TextInput
                                style={styles.input}
                                value={discogsUsername}
                                onChangeText={setDiscogsUsername}
                                placeholder="Your Discogs username"
                                placeholderTextColor={THEME.colors.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Personal Access Token</Text>
                            <View style={styles.tokenInputRow}>
                                <TextInput
                                    style={[styles.input, styles.tokenInput]}
                                    value={discogsToken}
                                    onChangeText={setDiscogsToken}
                                    placeholder="Paste your token here"
                                    placeholderTextColor={THEME.colors.textMuted}
                                    secureTextEntry={!showToken}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    style={styles.showToggle}
                                    onPress={() => setShowToken(v => !v)}
                                >
                                    <Text style={styles.showToggleText}>{showToken ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => Linking.openURL(DISCOGS_DEVELOPERS_URL)}>
                                <Text style={styles.helpLink}>How to get your token →</Text>
                            </TouchableOpacity>
                        </View>

                        {error && <Text style={styles.errorMsg}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]}
                            onPress={handleLink}
                            disabled={isSubmitDisabled}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Link Discogs</Text>
                            )}
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
    tokenInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tokenInput: {
        flex: 1,
    },
    showToggle: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    showToggleText: {
        color: THEME.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    helpLink: {
        color: THEME.colors.primary,
        fontSize: 13,
        marginTop: 8,
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
