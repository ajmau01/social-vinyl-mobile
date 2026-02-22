import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Image,
    Pressable,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useRouter } from 'expo-router';
import { useSyncCollection } from '@/hooks/useSyncCollection';
import { ActivityIndicator } from 'react-native';
import { COPY } from '@/constants/copy';

interface SessionDrawerProps {
    isVisible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export function SessionDrawer({ isVisible, onClose }: SessionDrawerProps) {
    const router = useRouter();
    const {
        username,
        avatarUrl,
        setUsername,
        setLastMode,
        setAuthToken,
        sessionId,
        sessionName,
        isBroadcast,
        setDisplayName
    } = useSessionStore();

    const { sync, syncStatus, syncProgress } = useSyncCollection();
    const isSyncing = syncStatus === 'syncing';

    const handleSwitchUser = () => {
        setUsername(null);
        setLastMode(null);
        setAuthToken(null);
        onClose();
        router.replace('/');
    };

    const handleSync = async () => {
        if (!username || isSyncing) return;
        await sync(username);
    };

    const handleBackToHub = () => {
        setLastMode(null);
        setAuthToken(null);
        onClose();
        router.replace('/');
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                <Pressable style={styles.drawerContainer} onPress={(e) => e.stopPropagation()}>
                    <BlurView intensity={100} tint="dark" style={styles.drawerContent}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Social Vinyl Menu</Text>
                            <TouchableOpacity testID="drawer-close-button" onPress={onClose}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.profileSection}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {username?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.profileInfo}>
                                <Text style={styles.userName}>{username}</Text>
                                <Text style={styles.statusText}>Connected</Text>
                            </View>
                        </View>

                        <View style={styles.optionsList}>
                            <TouchableOpacity testID="drawer-return-to-hub" style={styles.optionItem} onPress={handleBackToHub}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                                    <Ionicons name="grid-outline" size={20} color={THEME.colors.primary} />
                                </View>
                                <Text style={styles.optionLabel}>Return to Hub</Text>
                                <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                testID="drawer-sync-button"
                                style={styles.optionItem}
                                onPress={handleSync}
                                disabled={isSyncing}
                            >
                                <View style={[styles.iconBox, { backgroundColor: isSyncing ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)' }]}>
                                    {isSyncing ? (
                                        <ActivityIndicator size="small" color="#10b981" />
                                    ) : (
                                        <Ionicons name="sync-outline" size={20} color="#fbbf24" />
                                    )}
                                </View>
                                <View style={styles.optionLabelContainer}>
                                    <Text style={styles.optionLabel}>Sync Vinyl Collection</Text>
                                    {isSyncing && (
                                        <Text style={styles.optionSublabel}>Syncing... {syncProgress}%</Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                            </TouchableOpacity>

                            {sessionId ? (
                                <TouchableOpacity testID="drawer-manage-sessions" style={styles.optionItem} onPress={() => { onClose(); router.push('/session-list'); }}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                                        <Ionicons name="people-outline" size={20} color="#06b6d4" />
                                    </View>
                                    <View style={styles.optionLabelContainer}>
                                        <Text style={styles.optionLabel}>{sessionName || `Active ${COPY.SESSION_NOUN}`}</Text>
                                        <Text style={styles.optionSublabel}>{isBroadcast ? 'ON AIR' : 'Host'}</Text>
                                    </View>
                                    <Ionicons name="settings-outline" size={18} color={THEME.colors.textMuted} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity testID="drawer-manage-sessions" style={styles.optionItem} onPress={() => { onClose(); router.push('/session-list'); }}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                                        <Ionicons name="people-outline" size={20} color="#06b6d4" />
                                    </View>
                                    <View style={styles.optionLabelContainer}>
                                        <Text style={styles.optionLabel}>Manage {COPY.SESSION_NOUN_PLURAL}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity testID="drawer-history-button" style={styles.optionItem} onPress={() => { onClose(); router.push('/history'); }}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                    <Ionicons name="time-outline" size={20} color="#f59e0b" />
                                </View>
                                <View style={styles.optionLabelContainer}>
                                    <Text style={styles.optionLabel}>Listening History</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity testID="drawer-logout-button" style={styles.optionItem} onPress={handleSwitchUser}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                                </View>
                                <Text style={[styles.optionLabel, { color: '#ef4444' }]}>Logout / Switch Account</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>© 2026 Social Vinyl</Text>
                        </View>
                    </BlurView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    drawerContainer: {
        width: width * 0.85,
        height: '100%',
    },
    drawerContent: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Darker base for better contrast
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 30,
    },
    headerTitle: {
        fontFamily: 'Playfair Display', // We should ensure fonts are loaded
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 40,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarPlaceholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        marginLeft: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    statusText: {
        fontSize: 12,
        color: '#10b981', // Connected Green
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    optionsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 16,
        marginBottom: 5,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    optionLabelContainer: {
        flex: 1,
    },
    optionSublabel: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 20,
        marginHorizontal: 10,
    },
    footer: {
        padding: 30,
        alignItems: 'center',
    },
    footerText: {
        color: THEME.colors.textMuted,
        fontSize: 12,
    }
});
