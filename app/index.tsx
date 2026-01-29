import React, { useState, useEffect } from 'react';
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
import { wsService } from '@/services/WebSocketService';
import { syncService } from '@/services/CollectionSyncService';
import { StatusBar } from 'expo-status-bar';

type PersonaMode = 'none' | 'host' | 'guest' | 'solo';

export default function HubScreen() {
    const router = useRouter();
    const {
        username,
        setUsername,
        syncStatus,
        syncProgress,
        lastMode,
        setLastMode,
        authToken
    } = useSessionStore();

    const [mode, setMode] = useState<PersonaMode>('none');
    const [inputValue, setInputValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Vinyl Rotation Animation
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

    /* 
       AUTO-REDIRECT DISABLED: 
       Per user request, the Hub should be the mandatory landing page on launch.
       Redirection is now handled only via explicit persona actions.
    */

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleBack = () => {
        setMode('none');
        setError(null);
        setInputValue('');
        setPassword('');
    };

    const handleSoloBrowse = async () => {
        if (!inputValue.trim()) {
            setError('Please enter a Discogs username');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            setUsername(inputValue.trim());
            setLastMode('solo');
            await syncService.syncCollection(inputValue.trim());
            router.replace('/(tabs)/collection');
        } catch (e: any) {
            setError(e.message || 'Failed to sync collection');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestJoin = () => {
        if (inputValue.length !== 5) {
            setError('Please enter a 5-character code');
            return;
        }
        // Guest logic would go here
        setError('Guest mode coming soon in Phase 4');
    };

    const handleHostLogin = async () => {
        if (!inputValue.trim() || !password.trim()) {
            setError('Enter username and password');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await wsService.login(inputValue.trim(), password);
            router.replace('/(tabs)/collection');
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Mesh (Simulated with View) */}
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
                            {mode === 'none' ? (
                                <View style={styles.hubContent}>
                                    <View style={styles.logoContainer}>
                                        <Animated.View style={[styles.vinyl, { transform: [{ rotate: rotation }] }]}>
                                            <View style={styles.vinylCenter} />
                                        </Animated.View>
                                    </View>

                                    <Text style={styles.title}>Social Vinyl</Text>
                                    <Text style={styles.subtitle}>The digital companion for physical collections.</Text>

                                    <View style={styles.personaOptions}>
                                        <TouchableOpacity
                                            style={[styles.btnModern, styles.btnPrimary]}
                                            onPress={() => setMode('host')}
                                        >
                                            <Text style={styles.btnText}>Unlock the DJ Booth</Text>
                                            <Text style={styles.btnIcon}>→</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.btnModern}
                                            onPress={() => setMode('guest')}
                                        >
                                            <Text style={styles.btnText}>Join a Listening Party</Text>
                                            <Text style={styles.btnIcon}>→</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.btnModern}
                                            onPress={() => setMode('solo')}
                                        >
                                            <Text style={styles.btnText}>Browse Collection Solo</Text>
                                            <Text style={styles.btnIcon}>→</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.formContent}>
                                    <Text style={styles.formTitle}>
                                        {mode === 'host' && 'Host Login'}
                                        {mode === 'guest' && 'Join Party'}
                                        {mode === 'solo' && 'Browse Collection'}
                                    </Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>
                                            {mode === 'guest' ? 'Join Code' : 'Discogs Username'}
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={inputValue}
                                            onChangeText={setInputValue}
                                            placeholder={mode === 'guest' ? 'ABCDE' : 'e.g., ajmau'}
                                            placeholderTextColor={THEME.colors.textMuted}
                                            autoCapitalize={mode === 'guest' ? 'characters' : 'none'}
                                            maxLength={mode === 'guest' ? 5 : 50}
                                        />
                                    </View>

                                    {mode === 'host' && (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                placeholder="Enter password"
                                                placeholderTextColor={THEME.colors.textMuted}
                                            />
                                        </View>
                                    )}

                                    {error && <Text style={styles.errorMsg}>{error}</Text>}

                                    <View style={styles.authActions}>
                                        <TouchableOpacity style={styles.btnModern} onPress={handleBack}>
                                            <Text style={styles.btnText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.btnModern, styles.btnPrimary]}
                                            onPress={() => {
                                                if (mode === 'solo') handleSoloBrowse();
                                                if (mode === 'guest') handleGuestJoin();
                                                if (mode === 'host') handleHostLogin();
                                            }}
                                            disabled={loading || syncStatus === 'syncing'}
                                        >
                                            {loading || syncStatus === 'syncing' ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text style={styles.btnText}>
                                                    {mode === 'host' ? 'Unlock' : mode === 'guest' ? 'Join' : 'Browse'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {mode === 'solo' && (
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
        </View>
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
        fontWeight: '700', // Playfair Display equivalent
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
        // fontFamily: 'Playfair Display', // If available
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
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
        fontWeight: '600',
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
