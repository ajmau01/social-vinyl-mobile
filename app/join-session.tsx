import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { QRScanner } from '@/components/session/QRScanner';
import { LobbyModal } from '@/components/session/LobbyModal';

export default function JoinSessionScreen() {
    const router = useRouter();
    const { code } = useLocalSearchParams<{ code?: string }>();
    const { sessionService } = useServices();
    const { displayName, setDisplayName } = useSessionStore();

    const [joinCode, setJoinCode] = useState(code || '');
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showLobbyModal, setShowLobbyModal] = useState(false);

    // If a code was passed via deep link or params, try joining immediately
    useEffect(() => {
        if (code && code.length === 5) {
            handleJoinClick();
        }
    }, [code]);

    const handleJoinClick = () => {
        const trimmedCode = joinCode.trim().toUpperCase();

        if (trimmedCode.length !== 5) {
            setError('Please enter a 5-character join code');
            return;
        }

        setError(null);

        // If user already has a display name, join directly
        if (displayName) {
            executeJoin(trimmedCode, displayName);
        } else {
            // Otherwise, prompt for a name
            setShowLobbyModal(true);
        }
    };

    const handleLobbySubmit = (name: string) => {
        setDisplayName(name);
        setShowLobbyModal(false);
        executeJoin(joinCode.trim().toUpperCase(), name);
    };

    const handleScanSuccess = (scannedCode: string) => {
        setIsScanning(false);
        setJoinCode(scannedCode);

        // Auto-join after short delay to let scanner close smoothly
        setTimeout(() => {
            if (displayName) {
                executeJoin(scannedCode, displayName);
            } else {
                setShowLobbyModal(true);
            }
        }, 300);
    };

    const executeJoin = async (targetCode: string, name: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await sessionService.joinSession(targetCode, name);
            if (result) {
                // Success - navigate to bin
                router.replace('/(tabs)/bin');
            } else {
                setError('Failed to join session. Please check the code and try again.');
            }
        } catch (err: any) {
            console.error('Join session error:', err);
            setError(err.message || 'An unexpected error occurred while joining.');
        } finally {
            setLoading(false);
        }
    };

    if (isScanning) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Scan QR Code',
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.headerButton}>
                                <Ionicons name="close" size={24} color={THEME.colors.text} />
                            </TouchableOpacity>
                        )
                    }}
                />
                <QRScanner
                    onCodeScanned={handleScanSuccess}
                    onClose={() => setIsScanning(false)}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <Stack.Screen
                options={{
                    title: 'Join Session',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="close" size={24} color={THEME.colors.text} />
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="people-outline" size={64} color={THEME.colors.primary} />
                </View>

                <Text style={styles.title}>Join a Party</Text>
                <Text style={styles.subtitle}>Enter a 5-character code or scan a QR code to join your friends.</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.codeInput}
                        value={joinCode}
                        onChangeText={(text) => {
                            setJoinCode(text.toUpperCase());
                            setError(null);
                        }}
                        placeholder="ENTER CODE"
                        placeholderTextColor={THEME.colors.textMuted}
                        maxLength={5}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={THEME.colors.status.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.joinButton, (joinCode.length !== 5 || loading) && styles.disabledButton]}
                    onPress={handleJoinClick}
                    disabled={joinCode.length !== 5 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.joinButtonText}>Join Session</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => setIsScanning(true)}
                >
                    <Ionicons name="qr-code-outline" size={24} color={THEME.colors.primary} />
                    <Text style={styles.scanButtonText}>Scan QR Code</Text>
                </TouchableOpacity>

            </ScrollView>

            <LobbyModal
                visible={showLobbyModal}
                onSubmit={handleLobbySubmit}
                onCancel={() => {
                    setShowLobbyModal(false);
                    setLoading(false);
                }}
            />
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
        lineHeight: 24,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    codeInput: {
        width: '100%',
        backgroundColor: THEME.colors.surface,
        borderWidth: 2,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 12,
        padding: 20,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 8,
        color: THEME.colors.text,
        textAlign: 'center',
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
    joinButton: {
        width: '100%',
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: THEME.colors.glassBorder,
    },
    dividerText: {
        color: THEME.colors.textDim,
        marginHorizontal: 16,
        fontWeight: 'bold',
    },
    scanButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.primary + '50',
        paddingVertical: 16,
        borderRadius: 12,
    },
    scanButtonText: {
        color: THEME.colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
});
