import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '@/contexts/ServiceContext';
import { SessionCard as ISessionCard } from '@/types';
import { SessionCard } from '@/components/session/SessionCard';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket } from '@/hooks';
import { COPY } from '@/constants/copy';

export default function SessionListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sessionService } = useServices();
    const { sessionId, isBroadcast, setSessionId, setSessionSecret, setJoinCode, setSessionRole, setIsPermanent, setIsBroadcast, setSessionName, setHostUsername } = useSessionStore();

    const [sessions, setSessions] = useState<ISessionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoaded = useRef(false);
    const { isConnected } = useWebSocket();

    const loadSessions = async () => {
        try {
            const list = await sessionService.getSessions();
            // The backend returns both active and archived sessions to the host.
            // We only want to display active sessions in this view.
            setSessions((list || []).filter(s => s.active));
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isConnected && !hasLoaded.current) {
            hasLoaded.current = true;
            loadSessions();
        }
    }, [isConnected]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    const handleJoinSession = (session: ISessionCard) => {
        if (session.id.toString() === sessionId?.toString()) {
            return router.replace('/(tabs)/bin');
        }
        router.push(`/join-session?code=${session.code}`);
    };

    const handleEndSession = async (session: ISessionCard) => {
        // Optimistic removal: update UI immediately so the session disappears on tap.
        setSessions(prev => prev.filter(s => s.id !== session.id));

        try {
            const result = await sessionService.archiveSession(session.id);
            if (!result.success) {
                // Restore it on failure and alert the user
                Alert.alert('Error', 'Failed to delete the party. Please try again.');
                loadSessions(); // Re-fetch to restore the session in the list
            } else {
                // Clear local store if this was the user's active session AND the archive was successful
                if (session.id.toString() === sessionId?.toString()) {
                    setSessionId(null);
                    setSessionSecret(null);
                    setJoinCode(null);
                    setSessionRole(null);
                    setIsPermanent(false);
                    setIsBroadcast(false);
                    setSessionName(null);
                    setHostUsername(null);
                }
            }
        } catch (error) {
            // Restore on error so the user knows something went wrong
            Alert.alert('Error', 'Failed to delete the party. Please try again.');
            loadSessions();
            console.error('Failed to end session:', error);
        }
    };

    const handleShare = (session: ISessionCard) => {
        // Usually opens a share sheet or modal with the code
        // For now, we can route to an info screen or just log
        console.log('Sharing session:', session.code);
    };

    const handleToggleBroadcast = async (session: ISessionCard) => {
        const newBroadcastState = !session.isBroadcast;

        // Optimistic local update — flip isBroadcast, enforce single ON AIR
        setSessions(prev =>
            prev.map(s => {
                if (s.id === session.id) {
                    return { ...s, isBroadcast: newBroadcastState };
                }
                // Single broadcast enforcement: if turning one ON, turn others OFF
                if (newBroadcastState && s.isBroadcast) {
                    return { ...s, isBroadcast: false };
                }
                return s;
            })
        );

        try {
            await sessionService.setBroadcast(session.id);

            // Keep the global session store in sync
            if (newBroadcastState) {
                if (session.id.toString() === sessionId?.toString()) {
                    setIsBroadcast(true);
                } else {
                    // Another session stole the broadcast; active session is no longer broadcasting
                    setIsBroadcast(false);
                }
            } else {
                if (session.id.toString() === sessionId?.toString()) {
                    setIsBroadcast(false);
                }
            }
        } catch (error) {
            // Roll back on failure (naive rollback — doesn't restore stolen broadcasts perfectly, 
            // but next pull-to-refresh will correct it)
            setSessions(prev =>
                prev.map(s => s.id === session.id ? { ...s, isBroadcast: session.isBroadcast } : s)
            );
            console.error('Failed to toggle broadcast:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.customHeader, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{COPY.SESSION_NOUN_PLURAL}</Text>
                <TouchableOpacity onPress={loadSessions} style={styles.headerButton}>
                    <Ionicons name="refresh" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={[styles.actionRow]}>
                <TouchableOpacity
                    style={[styles.primaryAction, { marginRight: 8 }]}
                    onPress={() => router.push('/create-session')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text style={styles.primaryActionText}>{COPY.ACTION_START_PARTY}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.secondaryAction, { marginLeft: 8 }]}
                    onPress={() => router.push('/join-session')}
                >
                    <Ionicons name="enter-outline" size={24} color={THEME.colors.primary} />
                    <Text style={styles.secondaryActionText}>{COPY.ACTION_JOIN_PARTY}</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                </View>
            ) : sessions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="albums-outline" size={64} color={THEME.colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Active Parties</Text>
                    <Text style={styles.emptySubtitle}>Start a listening party or join an existing one to listen together.</Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <SessionCard
                            session={item}
                            isActiveCurrentSession={item.id.toString() === sessionId?.toString()}
                            onJoin={() => handleJoinSession(item)}
                            onEnd={() => handleEndSession(item)}
                            onShare={() => handleShare(item)}
                            onToggleBroadcast={() => handleToggleBroadcast(item)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 12,
        backgroundColor: THEME.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
        backgroundColor: THEME.colors.surface,
    },
    primaryAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.primary,
        paddingVertical: 12,
        borderRadius: 8,
    },
    primaryActionText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    secondaryAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.primary + '15',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.colors.primary + '30',
    },
    secondaryActionText: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Safe area
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        textAlign: 'center',
        lineHeight: 24,
    },
});
