// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '@/contexts/ServiceContext';
import { useSessionStore } from '@/store/useSessionStore';
import { QRScanner } from '@/components/session/QRScanner';
import { GuestJoinModal } from '@/components/session/GuestJoinModal';
import { COPY } from '@/constants/copy';
import { sanitizeDisplayName } from '@/utils/validation';
import { secureStorage } from '@/utils/storage';

export default function JoinSessionScreen() {
    const router = useRouter();
    const { code } = useLocalSearchParams<{ code?: string }>();
    const { sessionService } = useServices();
    
    const { displayName, setDisplayName, username, joinCode: storedJoinCode, setJoinCode: setStoreJoinCode } = useSessionStore(useShallow(state => ({
        displayName: state.displayName,
        setDisplayName: state.setDisplayName,
        username: state.username,
        joinCode: state.joinCode,
        setJoinCode: state.setJoinCode
    })));

    const [joinCode, setJoinCode] = useState(code || storedJoinCode || '');
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    
    // NB-3: Track the target code across modal opens
    const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
    
    const hasAttemptedAutoJoin = useRef(false);

    // NB-1: Gate auto-join on imperative credential read to avoid hydrate race
    useEffect(() => {
        const attemptAutoJoin = async () => {
            const targetCode = code || storedJoinCode;
            if (targetCode && targetCode.length === 5 && !hasAttemptedAutoJoin.current) {
                hasAttemptedAutoJoin.current = true;
                
                // Read from secure storage directly to avoid hydrate race
                const token = await secureStorage.getAuthToken();
                const nameToUse = username || displayName;
                
                if (token && nameToUse) {
                    executeJoin(targetCode, nameToUse);
                } else {
                    setPendingJoinCode(targetCode);
                    setShowJoinModal(true);
                }
            }
        };
        attemptAutoJoin();
    }, [code, storedJoinCode]);

    const handleJoinClick = async (overrideCode?: string) => {
        const targetCode = (overrideCode || joinCode).trim().toUpperCase();

        if (targetCode.length !== 5) {
            setError('Please enter a 5-character join code');
            return;
        }

        setError(null);

        // Read from secure storage directly
        const token = await secureStorage.getAuthToken();
        const nameToUse = username || displayName;
        
        if (token && nameToUse) {
            executeJoin(targetCode, nameToUse);
        } else {
            // NB-3: Ensure override code is used even if local joinCode state is stale
            setPendingJoinCode(targetCode);
            setShowJoinModal(true);
        }
    };

    const handleGuestSubmit = (name: string) => {
        // BLOCK-2: Sanitize name
        const sanitizedName = sanitizeDisplayName(name);
        setDisplayName(sanitizedName);
        setShowJoinModal(false);
        
        // NB-3: Use pendingJoinCode if available
        const targetCode = pendingJoinCode || joinCode.trim().toUpperCase();
        executeJoin(targetCode, sanitizedName);
    };

    const handleScanSuccess = async (scannedCode: string) => {
        setIsScanning(false);
        setJoinCode(scannedCode);

        // Auto-join after short delay to let scanner close smoothly
        setTimeout(async () => {
            try {
                const token = await secureStorage.getAuthToken();
                const nameToUse = username || displayName;
                if (token && nameToUse) {
                    executeJoin(scannedCode, nameToUse);
                } else {
                    setPendingJoinCode(scannedCode);
                    setShowJoinModal(true);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to read credentials after scan.');
            }
        }, 300);
    };

    const executeJoin = async (targetCode: string, name: string) => {
        setLoading(true);
        setError(null);

        try {
            // BLOCK-2: Sanitize just in case
            const sanitizedName = sanitizeDisplayName(name);
            const result = await sessionService.joinSession(targetCode, sanitizedName);
            if (result.success) {
                // NB-2: Clear join code on success
                setStoreJoinCode(null);
                // Success - navigate to bin (Guests have no collection)
                router.replace('/(tabs)/bin');
            } else {
                setError(result.error?.message || 'Failed to join party. Please check the code and try again.');
                setShowJoinModal(true);
            }
        } catch (err: any) {
            console.error('Join session error:', err);
            setError(err.message || 'An unexpected error occurred while joining.');
            setShowJoinModal(true);
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
                    title: `Join a ${COPY.SESSION_NOUN}`,
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
                    onPress={() => handleJoinClick()}
                    disabled={joinCode.length !== 5 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.joinButtonText}>Join Party</Text>
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

            <GuestJoinModal
                visible={showJoinModal}
                initialName={displayName || undefined}
                onSubmit={handleGuestSubmit}
                onCancel={() => {
                    setShowJoinModal(false);
                    setLoading(false);
                    setStoreJoinCode(null); // NB-2: Clear join code on cancel
                }}
                loading={loading}
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
