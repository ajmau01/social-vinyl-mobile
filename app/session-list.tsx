import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
            setSessions(list || []);
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
        // Confirm deletion in a real scenario
        try {
            await sessionService.archiveSession(session.id);
            // Local store cleanup using existing setters
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
            loadSessions();
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    };

    const handleShare = (session: ISessionCard) => {
        // Usually opens a share sheet or modal with the code
        // For now, we can route to an info screen or just log
        console.log('Sharing session:', session.code);
    };

    const handleToggleBroadcast = async (session: ISessionCard) => {
        try {
            const newBroadcastState = !session.isBroadcast;
            await sessionService.setBroadcast(session.id);
            loadSessions();

            // If it's the current session, update local store
            if (session.id.toString() === sessionId?.toString()) {
                setIsBroadcast(newBroadcastState);
            }
        } catch (error) {
            console.error('Failed to toggle broadcast:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: COPY.SESSION_NOUN_PLURAL,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="chevron-back" size={24} color={THEME.colors.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={loadSessions} style={styles.headerButton}>
                            <Ionicons name="refresh" size={24} color={THEME.colors.text} />
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.primaryAction, { marginRight: 8 }]}
                    onPress={() => router.push('/create-session')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text style={styles.primaryActionText}>Start Party</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.secondaryAction, { marginLeft: 8 }]}
                    onPress={() => router.push('/join-session')}
                >
                    <Ionicons name="enter-outline" size={24} color={THEME.colors.primary} />
                    <Text style={styles.secondaryActionText}>Join Party</Text>
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
    headerButton: {
        padding: 8,
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
