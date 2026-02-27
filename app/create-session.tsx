// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Switch,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { COPY } from '@/constants/copy';
import { SessionModeSelector, SessionMode } from '@/components/session/SessionModeSelector';

export default function CreateSessionScreen() {
    const router = useRouter();
    const { sessionService } = useServices();
    const { username } = useSessionStore();

    const [mode, setMode] = useState<SessionMode>('party');
    const [name, setName] = useState('');
    const [isPermanent, setIsPermanent] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ctaLabel = mode === 'party'
        ? COPY.CTA_START_PARTY
        : mode === 'live'
        ? COPY.CTA_GO_LIVE
        : COPY.CTA_START_PLAYING;

    const namePlaceholder = mode === 'party'
        ? `${username || 'My'}'s Listening Party`
        : `${username || 'Me'} is Live`;

    const isNameRequired = mode === 'party';
    const showNameInput = mode !== 'solo';

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (isNameRequired && !trimmed) {
            setError('Please enter a party name');
            return;
        }

        const finalName: string = mode === 'solo'
            ? `Solo \u2014 ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : mode === 'live' && !trimmed
            ? `${username} is Live`
            : trimmed;

        setLoading(true);
        setError(null);

        try {
            const result = await sessionService.createSession(finalName, isPermanent, mode);

            if (result.success) {
                if (mode === 'live') {
                    await sessionService.setBroadcast(Number(result.data.sessionId));
                }
                router.replace('/');
            } else {
                setError('Failed to create session');
            }
        } catch (err: any) {
            console.error('Create session error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom header row */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="close" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Start a Session</Text>
                <View style={styles.headerButton} />
            </View>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionLabel}>Choose a mode</Text>
                <SessionModeSelector selectedMode={mode} onModeChange={setMode} />

                <View style={styles.configSection}>
                    {showNameInput ? (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                {mode === 'party' ? 'Party Name' : 'Session Label (optional)'}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    setError(null);
                                }}
                                placeholder={namePlaceholder}
                                placeholderTextColor={THEME.colors.textMuted}
                                maxLength={48}
                            />
                        </View>
                    ) : (
                        <View style={styles.soloInfo}>
                            <Ionicons name="lock-closed-outline" size={20} color={THEME.colors.textDim} />
                            <Text style={styles.soloText}>Starting a private session\u2026</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.advancedToggle}
                    onPress={() => setAdvancedOpen((v) => !v)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.advancedLabel}>Advanced</Text>
                    <Ionicons
                        name={advancedOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={THEME.colors.textDim}
                    />
                </TouchableOpacity>

                {advancedOpen && (
                    <View style={styles.switchGroup}>
                        <View style={styles.switchInfo}>
                            <Text style={styles.label}>Family Pass (Always-on Party)</Text>
                            <Text style={styles.switchDescription}>
                                Permanent sessions don't expire when you leave. Perfect for households or shared
                                spaces.
                            </Text>
                        </View>
                        <Switch
                            value={isPermanent}
                            onValueChange={setIsPermanent}
                            trackColor={{ false: THEME.colors.textMuted, true: THEME.colors.primary + '80' }}
                            thumbColor={isPermanent ? THEME.colors.primary : '#f4f3f4'}
                        />
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={THEME.colors.status.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>{ctaLabel}</Text>
                    )}
                </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
    },
    headerTitle: {
        color: THEME.colors.text,
        fontSize: 17,
        fontWeight: '600',
    },
    headerButton: {
        padding: 8,
        width: 40,
    },
    content: {
        padding: 24,
    },
    sectionLabel: {
        fontSize: 13,
        color: THEME.colors.textMuted,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    configSection: {
        marginTop: 24,
        marginBottom: 8,
    },
    formGroup: {
        width: '100%',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 8,
    },
    input: {
        width: '100%',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: THEME.colors.text,
    },
    soloInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        backgroundColor: THEME.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    soloText: {
        color: THEME.colors.textDim,
        fontSize: 15,
    },
    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    advancedLabel: {
        color: THEME.colors.textDim,
        fontSize: 14,
        fontWeight: '600',
    },
    switchGroup: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchDescription: {
        fontSize: 14,
        color: THEME.colors.textDim,
        marginTop: 4,
        lineHeight: 20,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.status.error + '15',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        marginBottom: 24,
        marginTop: 8,
    },
    errorText: {
        color: THEME.colors.status.error,
        marginLeft: 8,
        flex: 1,
    },
    createButton: {
        width: '100%',
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    disabledButton: {
        opacity: 0.5,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
