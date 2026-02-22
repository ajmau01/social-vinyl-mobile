import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { wsService } from '@/services/WebSocketService';
import { syncService } from '@/services/CollectionSyncService';
import { useServices } from '@/contexts/ServiceContext';
import { CONFIG } from '@/config';
import { StatusBar } from 'expo-status-bar';

import { validateUsername, validatePartyCode } from '@/utils/validation';
import { COPY } from '@/constants/copy';

type EntryPath = 'none' | 'collector' | 'invited' | 'explore';

export default function WelcomeScreen() {
    const router = useRouter();
    const {
        username,
        setUsername,
        syncStatus,
        syncProgress,
        lastMode,
        setLastMode,
        authToken,
        familyPassCode,
        displayName,
        connectionState,
        sessionId: sessionStoreId
    } = useSessionStore();

    const { sessionService } = useServices();

    const [entryPath, setEntryPath] = useState<EntryPath>('none');
    const [inputValue, setInputValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [autoRejoined, setAutoRejoined] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Issue #142 V3: Auto-logging loading guard (includes connecting states to prevent flicker)
    // Now gated by hasInteracted to prevent trapping users who explicitly cancel a manual path.
    // Also checks for legacy lastMode values to avoid "dead zones" where it spins but never redirects.
    const isAutoLogging = !hasInteracted &&
        (connectionState === 'connected' || connectionState === 'connecting' || connectionState === 'reconnecting') &&
        !!sessionStoreId &&
        entryPath === 'none' &&
        (
            (!!familyPassCode && !!displayName) ||
            ((lastMode as any) === 'collector' || (lastMode as any) === 'explore' || (lastMode as any) === 'host' || (lastMode as any) === 'solo')
        );

    // Auto-rejoin Family Pass Logic
    useEffect(() => {
        if (CONFIG.IS_E2E) return;

        if (familyPassCode && displayName && entryPath === 'none' && !autoRejoined) {
            const tryAutoRejoin = async () => {
                setLoading(true);
                setAutoRejoined(true);
                try {
                    const result = await sessionService.joinSession(familyPassCode, displayName);
                    if (result.success) {
                        useListeningBinStore.getState().clearBin();
                        router.replace('/(tabs)/bin');
                    } else {
                        // Failed to rejoin (maybe session ended), clear the family pass
                        useSessionStore.getState().setFamilyPassCode(null);
                    }
                } catch (e) {
                    console.error('Auto-rejoin failed', e);
                } finally {
                    setLoading(false);
                }
            };
            tryAutoRejoin();
        }
    }, [familyPassCode, displayName, entryPath, autoRejoined, sessionService, router]);

    // Issue #142 V2.1: Auto-redirect returning Users/Collectors
    useEffect(() => {
        if (CONFIG.IS_E2E) return;

        // Only redirect if we have a session, are connected, and haven't selected a path manually
        if (sessionStoreId && entryPath === 'none' && !loading && !autoRejoined && connectionState === 'connected' && !hasInteracted) {
            const mode = lastMode as any;
            if (mode === 'collector' || mode === 'explore' || mode === 'host' || mode === 'solo') {
                router.replace('/(tabs)/collection');
            }
        }
    }, [sessionStoreId, entryPath, loading, autoRejoined, connectionState, lastMode, router, hasInteracted]);

    // Vinyl Rotation Animation
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (CONFIG.IS_E2E) return;

        const startRotation = () => {
            rotateAnim.setValue(0);
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 5000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start((result) => {
                if (result.finished) {
                    startRotation();
                }
            });
        };

        startRotation();
    }, [rotateAnim]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleBack = () => {
        setEntryPath('none');
        setError(null);
        setInputValue('');
        setPassword('');
    };

    const handleExplore = async () => {
        const userId = inputValue.trim();
        if (!validateUsername(userId)) {
            setError('Please enter a valid Discogs username (3-30 chars, alphanumeric)');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await syncService.syncCollection(userId, {
                onProgress: (p) => useSessionStore.getState().setSyncProgress(p),
                onStatusChange: (s) => useSessionStore.getState().setSyncStatus(s)
            });

            if (result.success) {
                const store = useSessionStore.getState();
                store.resetSession(); // Ensure no previous host/guest state bleeds in
                store.setUsername(userId);
                store.setLastMode('explore');
                store.setSessionRole('voyeur'); // Explicitly set voyeur role

                if (result.data.avatarUrl) {
                    store.setAvatarUrl(result.data.avatarUrl);
                }
                store.setLastSyncTime(result.data.syncTime);

                useListeningBinStore.getState().clearBin(); // Issue #126: Clear old data
                router.replace('/(tabs)/collection');
            } else {
                setError(result.error.message || 'Failed to sync collection');
            }
        } catch (e: any) {
            setError(e.message || 'Failed to sync collection');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestJoin = () => {
        if (!validatePartyCode(inputValue)) {
            setError('Please enter a valid 5-character alphanumeric code');
            return;
        }

        setLoading(true);
        setError(null);

        const guestUsername = `Guest-${Math.floor(Math.random() * 1000)}`;

        wsService.joinSession(inputValue, guestUsername)
            .then(result => {
                if (result.success) {
                    useSessionStore.getState().setUsername(guestUsername);
                    useSessionStore.getState().setLastMode('invited');
                    // Session ID and Name should be returned in result.data from join-session payload
                    if (result.data) {
                        if (result.data.sessionId) useSessionStore.getState().setSessionId(result.data.sessionId);
                        if (result.data.name) useSessionStore.getState().setSessionName(result.data.name);
                        if (result.data.hostUsername) useSessionStore.getState().setHostUsername(result.data.hostUsername);
                    }

                    useListeningBinStore.getState().clearBin(); // Issue #126: Clear old data
                    router.replace('/(tabs)/bin');
                } else {
                    setError(result.error.message || 'Failed to join party');
                }
            })
            .catch(err => {
                setError(err.message || 'Join failed');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleCollectorLogin = async () => {
        const userId = inputValue.trim();
        if (!validateUsername(userId) || !password.trim()) {
            setError('Enter a valid username and password');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await wsService.login(userId, password);
            if (result.success) {
                const { data } = result;
                const userId = data.userId || inputValue.trim();
                const store = useSessionStore.getState();

                store.setAuthToken(data.token);
                store.setUsername(userId);
                store.setLastMode('collector');
                if (data.sessionId) {
                    await store.setSessionId(String(data.sessionId));
                }
                if (data.sessionSecret) {
                    await store.setSessionSecret(data.sessionSecret);
                }
                if (data.joinCode) {
                    store.setJoinCode(data.joinCode);
                }
                if (data.sessionName) {
                    store.setSessionName(data.sessionName);
                }
                if (data.hostUsername) {
                    store.setHostUsername(data.hostUsername);
                }
                if (data.isPermanent !== undefined) {
                    store.setIsPermanent(data.isPermanent);
                }
                store.setSessionRole('host');

                useSessionStore.getState().setSyncStatus('syncing');
                router.replace('/(tabs)/collection');

                useListeningBinStore.getState().clearBin(); // Issue #126: Clear old data

                syncService.syncCollection(userId, {
                    onProgress: (p) => useSessionStore.getState().setSyncProgress(p),
                    onStatusChange: (s) => useSessionStore.getState().setSyncStatus(s)
                }).then(syncResult => {
                    if (!syncResult.success) {
                        console.error('[Login] Auto-sync failed:', syncResult.error);
                    }
                });
            } else {
                setError(result.error.message || 'Login failed');
            }
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.meshBg}>
                <View style={styles.meshNode1} />
                <View style={styles.meshNode2} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="light" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <BlurView intensity={10} tint="dark" style={styles.glassPanel}>
                            {isAutoLogging ? (
                                <View style={styles.hubContent}>
                                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                                    <Text style={[styles.subtitle, { marginTop: 20 }]}>{COPY.HUB_AUTO_LOGGING}</Text>
                                </View>
                            ) : entryPath === 'none' ? (
                                <View style={styles.hubContent}>
                                    <View style={styles.logoContainer}>
                                        <Animated.View style={[styles.vinyl, { transform: [{ rotate: rotation }] }]}>
                                            <View style={styles.vinylCenter} />
                                        </Animated.View>
                                    </View>

                                    <Text style={styles.title}>Social Vinyl</Text>
                                    <Text style={styles.subtitle}>{COPY.TAGLINE}</Text>
                                    <Text style={styles.valueProp}>{COPY.WELCOME_VALUE_PROP}</Text>

                                    <View style={styles.personaOptions}>
                                        <TouchableOpacity
                                            testID="mode-host"
                                            style={[styles.btnModern, styles.btnPrimary]}
                                            onPress={() => {
                                                setHasInteracted(true);
                                                setEntryPath('collector');
                                            }}
                                        >
                                            <View>
                                                <Text style={styles.btnText}>{COPY.INTENT_HOST}</Text>
                                                <Text style={styles.btnSubtitle}>{COPY.SUBTITLE_COLLECTOR}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            testID="mode-solo"
                                            style={styles.btnModern}
                                            onPress={() => {
                                                setHasInteracted(true);
                                                setEntryPath('explore');
                                            }}
                                        >
                                            <View>
                                                <Text style={styles.btnText}>{COPY.INTENT_SOLO}</Text>
                                                <Text style={styles.btnSubtitle}>{COPY.SUBTITLE_EXPLORE}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            testID="mode-invited"
                                            onPress={() => {
                                                setHasInteracted(true);
                                                setEntryPath('invited');
                                            }}
                                            style={styles.invitedButton}
                                        >
                                            <Text style={styles.invitedText}>
                                                Invited to a party? <Text style={styles.invitedLink}>Tap here</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* E2E Partition: Visible buttons for detox tests */}
                                    {CONFIG.IS_E2E && (
                                        <View testID="e2e-mode-select" style={styles.hubContent}>
                                            <TouchableOpacity testID="mode-host" onPress={() => setEntryPath('collector')}>
                                                <Text>Host</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity testID="mode-guest" onPress={() => setEntryPath('invited')}>
                                                <Text>Guest</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity testID="mode-solo" onPress={() => setEntryPath('explore')}>
                                                <Text>Solo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.formContent}>
                                    <Text style={styles.formTitle}>
                                        {entryPath === 'collector' && COPY.HUB_HOST_TITLE}
                                        {entryPath === 'invited' && COPY.HUB_GUEST_TITLE}
                                        {entryPath === 'explore' && COPY.HUB_SOLO_TITLE}
                                    </Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>
                                            {entryPath === 'invited' ? 'Join Code' : 'Discogs Username'}
                                        </Text>
                                        <TextInput
                                            testID="login-input"
                                            style={styles.input}
                                            value={inputValue}
                                            onChangeText={setInputValue}
                                            placeholder={entryPath === 'invited' ? 'ABCDE' : 'e.g., ajmau'}
                                            placeholderTextColor={THEME.colors.textMuted}
                                            autoCapitalize={entryPath === 'invited' ? 'characters' : 'none'}
                                            maxLength={entryPath === 'invited' ? 5 : 50}
                                            autoComplete="off"
                                            importantForAutofill="no"
                                        />
                                    </View>

                                    {entryPath === 'collector' && (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Password</Text>
                                            <TextInput
                                                testID="login-password"
                                                style={styles.input}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                placeholder="Enter password"
                                                placeholderTextColor={THEME.colors.textMuted}
                                                autoComplete="off"
                                                importantForAutofill="no"
                                            />
                                        </View>
                                    )}

                                    {error && <Text testID="login-error" style={styles.errorMsg}>{error}</Text>}

                                    <View style={styles.authActions}>
                                        <TouchableOpacity testID="login-cancel" style={styles.btnModern} onPress={handleBack}>
                                            <Text style={styles.btnText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            testID="login-submit"
                                            style={[styles.btnModern, styles.btnPrimary]}
                                            onPress={() => {
                                                if (entryPath === 'explore') handleExplore();
                                                if (entryPath === 'invited') handleGuestJoin();
                                                if (entryPath === 'collector') handleCollectorLogin();
                                            }}
                                            disabled={loading || syncStatus === 'syncing'}
                                        >
                                            {loading || syncStatus === 'syncing' ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <ActivityIndicator color="white" />
                                                    {syncStatus === 'syncing' && (
                                                        <Text style={styles.btnText}>{syncProgress}%</Text>
                                                    )}
                                                </View>
                                            ) : (
                                                <Text style={styles.btnText}>
                                                    {entryPath === 'collector' ? 'Unlock' : entryPath === 'invited' ? 'Join' : 'Browse'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {entryPath === 'explore' && (
                                        <Text style={styles.infoText}>
                                            First scan takes 5-10 mins. Subsequent visits load instantly.
                                        </Text>
                                    )}
                                </View>
                            )}
                        </BlurView>

                        <Text style={styles.footerText}>© 2026 Social Vinyl. Powered by Discogs.</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    meshBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    meshNode1: {
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '80%',
        height: '60%',
        borderRadius: 200,
        backgroundColor: 'rgba(124, 58, 237, 0.12)',
    },
    meshNode2: {
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: '80%',
        height: '60%',
        borderRadius: 200,
        backgroundColor: 'rgba(219, 39, 119, 0.12)',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    glassPanel: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 32,
        padding: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    hubContent: {
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 30,
    },
    vinyl: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1a1a1a',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    vinylCenter: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.primary,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        textAlign: 'center',
        marginBottom: 5,
        lineHeight: 22,
    },
    valueProp: {
        fontSize: 14,
        color: THEME.colors.textMuted,
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 40,
    },
    personaOptions: {
        width: '100%',
        gap: 15,
    },
    btnModern: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 18,
        borderRadius: 16,
    },
    btnPrimary: {
        backgroundColor: THEME.colors.primary,
        borderColor: 'transparent',
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    btnSubtitle: {
        color: THEME.colors.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    btnIcon: {
        color: '#fff',
        fontSize: 20,
        opacity: 0.7,
    },
    formContent: {
        width: '100%',
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 30,
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
        padding: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    authActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 30,
    },
    invitedButton: {
        marginTop: 25,
        alignSelf: 'center',
        padding: 10,
    },
    invitedText: {
        color: THEME.colors.textMuted,
        fontSize: 16,
    },
    invitedLink: {
        color: THEME.colors.primary,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    errorMsg: {
        color: THEME.colors.status.error,
        textAlign: 'center',
        marginTop: 10,
    },
    infoText: {
        color: THEME.colors.textMuted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 18,
    },
    footerText: {
        textAlign: 'center',
        color: THEME.colors.textMuted,
        fontSize: 14,
        marginTop: 40,
    }
});
