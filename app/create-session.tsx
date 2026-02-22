import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { COPY } from '@/constants/copy';

export default function CreateSessionScreen() {
    const router = useRouter();
    const { sessionService } = useServices();
    const { username } = useSessionStore();

    // Default session name based on user
    const [name, setName] = useState(`${username || 'My'}'s ${COPY.SESSION_NOUN}`);
    const [isPermanent, setIsPermanent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Please enter a party name');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await sessionService.createSession(
                trimmedName,
                isPermanent
            );

            if (result) {
                // Return to bin view on success
                router.replace('/(tabs)/bin');
            } else {
                setError('Failed to create party');
            }
        } catch (err: any) {
            console.error('Create session error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <Stack.Screen
                options={{
                    title: 'Start a Listening Party',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="close" size={24} color={THEME.colors.text} />
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="musical-notes-outline" size={64} color={THEME.colors.primary} />
                </View>

                <Text style={styles.title}>Start a Party</Text>
                <Text style={styles.subtitle}>Start a {COPY.SESSION_NOUN_SENTENCE} for friends to join and listen together.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Party Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            setError(null);
                        }}
                        placeholder="e.g. Friday Night Chills"
                        placeholderTextColor={THEME.colors.textMuted}
                        maxLength={32}
                    />
                </View>

                <View style={styles.switchGroup}>
                    <View style={styles.switchInfo}>
                        <Text style={styles.label}>Family Pass (Always-on Party)</Text>
                        <Text style={styles.switchDescription}>
                            Permanent sessions don't expire when you leave. Perfect for households or shared spaces.
                        </Text>
                    </View>
                    <Switch
                        value={isPermanent}
                        onValueChange={setIsPermanent}
                        trackColor={{ false: THEME.colors.textMuted, true: THEME.colors.primary + '80' }}
                        thumbColor={isPermanent ? THEME.colors.primary : '#f4f3f4'}
                    />
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={THEME.colors.status.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.createButton, (!name.trim() || loading) && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={!name.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>Start Party</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    headerButton: {
        padding: 8,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: THEME.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        textAlign: 'center',
        marginBottom: 32,
    },
    formGroup: {
        width: '100%',
        marginBottom: 24,
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
        marginBottom: 32,
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
