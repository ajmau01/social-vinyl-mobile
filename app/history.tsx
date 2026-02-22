import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useServices } from '@/contexts/ServiceContext';
import { SessionHistory } from '@/types';
import { logger } from '@/utils/logger';

// --- HistoryListItem Component ---

interface HistoryListItemProps {
    session: SessionHistory;
    onPress: (sessionId: string) => void;
}

const HistoryListItem: React.FC<HistoryListItemProps> = ({ session, onPress }) => {
    const formattedDate = format(new Date(session.started_at), 'MMM d, yyyy');
    const isActive = !session.ended_at;

    return (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => onPress(session.id)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={session.mode === 'party' ? 'people' : 'person'}
                    size={24}
                    color={isActive ? '#10b981' : '#64748b'}
                />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.sessionName} numberOfLines={1}>
                    {session.session_name || 'Unnamed Session'}
                </Text>
                <Text style={styles.metaText}>
                    {formattedDate} • Hosted by @{session.host_username}
                </Text>
                {isActive && (
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeText}>Active</Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
    );
};

// --- History Screen ---

export default function HistoryScreen() {
    const [sessions, setSessions] = useState<SessionHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { databaseService } = useServices();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const loadHistory = useCallback(async () => {
        try {
            const data = await databaseService.getSessionsHistory(50, 0);
            setSessions(data);
        } catch (error) {
            logger.error('[HistoryScreen] Failed to load history', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [databaseService]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadHistory();
    }, [loadHistory]);

    const handleNavigateToSetlist = useCallback((sessionId: string) => {
        router.push(`/setlist/${sessionId}`);
    }, [router]);

    const renderEmpty = () => {
        if (isLoading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color="#cbd5e1" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptyText}>
                    Join or host a party to start building your listening history.
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>History</Text>
                    <Text style={styles.subtitle}>Your Social Vinyl time capsule</Text>
                </View>
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f8fafc" />
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <HistoryListItem
                            session={item}
                            onPress={handleNavigateToSetlist}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        backgroundColor: '#0f172a',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    // ListItem styles
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
    },
    sessionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    activeBadge: {
        marginTop: 6,
        backgroundColor: '#064e3b',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    activeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#34d399',
        textTransform: 'uppercase',
    }
});
