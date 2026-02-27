// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/useSessionStore';
import { useServices } from '@/contexts/ServiceContext';
import { SessionModeSelector, SessionMode } from '@/components/session/SessionModeSelector';

interface SessionHistoryRecord {
    id: string;
    session_name: string;
    host_username: string;
    started_at: number;
    ended_at: number | null;
    mode: string;
    guest_count: number;
    record_count?: number;
}

export function HostHomeScreen() {
    const router = useRouter();
    const { username, lastSyncTime } = useSessionStore();
    const { sessionService, databaseService } = useServices();

    const [history, setHistory] = useState<SessionHistoryRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<SessionMode | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const all = await databaseService.getSessionsHistory(10);
                const mine = (all as SessionHistoryRecord[]).filter(
                    (s) => s.host_username === username
                );
                setHistory(mine);
            } catch {
                // Graceful empty state on error
            } finally {
                setHistoryLoading(false);
            }
        };
        load();
    }, [username, databaseService]);

    const handleGoLive = async () => {
        if (actionLoading) return;
        setActionLoading('live');
        try {
            const result = await sessionService.createSession(
                `${username} is Live`,
                false,
                'live'
            );
            if (result.success) {
                await sessionService.setBroadcast(Number(result.data.sessionId));
                // isSessionActive gate in index.tsx handles navigation to ActiveSessionView
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleSolo = async () => {
        if (actionLoading) return;
        setActionLoading('solo');
        try {
            const dateStr = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            await sessionService.createSession(`Solo \u2014 ${dateStr}`, false, 'solo');
            // isSessionActive gate handles navigation
        } finally {
            setActionLoading(null);
        }
    };

    const handleModeSelect = (mode: SessionMode) => {
        if (mode === 'party') {
            router.push('/create-session');
        } else if (mode === 'live') {
            handleGoLive();
        } else {
            handleSolo();
        }
    };

    const lastSession = history[0];

    const syncTimeLabel = lastSyncTime
        ? `Last synced ${new Date(lastSyncTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
          })}`
        : 'Not yet synced';

    const initial = (username || '?')[0].toUpperCase();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.identity}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                        </View>
                        <Text style={styles.username}>{username}</Text>
                    </View>
                </View>

                {/* Recent History Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{COPY.HOST_HOME_LAST_SESSION}</Text>

                    {historyLoading ? (
                        <ActivityIndicator
                            color={THEME.colors.primary}
                            style={styles.loadingIndicator}
                        />
                    ) : lastSession ? (
                        <>
                            <TouchableOpacity
                                style={styles.historyCard}
                                onPress={() => router.push(`/setlist/${lastSession.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.historyCardContent}>
                                    <Text style={styles.historyName} numberOfLines={1}>
                                        {lastSession.session_name}
                                    </Text>
                                    <Text style={styles.historyMeta}>
                                        {new Date(lastSession.started_at).toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            }
                                        )}
                                        {lastSession.record_count
                                            ? ` \u00b7 ${lastSession.record_count} records`
                                            : ''}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={THEME.colors.textDim}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/history' as any)}
                                style={styles.seeAllLink}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.seeAllText}>{COPY.HOST_HOME_SEE_ALL}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="time-outline"
                                size={32}
                                color={THEME.colors.textMuted}
                                style={styles.emptyIcon}
                            />
                            <Text style={styles.emptyText}>{COPY.HOST_HOME_HISTORY_EMPTY}</Text>
                        </View>
                    )}
                </View>

                {/* Start Something Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{COPY.HOST_HOME_START_SOMETHING}</Text>
                    <SessionModeSelector selectedMode="party" onModeChange={handleModeSelect} />

                    {actionLoading && (
                        <View style={styles.actionLoadingRow}>
                            <ActivityIndicator color={THEME.colors.primary} size="small" />
                            <Text style={styles.actionLoadingText}>
                                {actionLoading === 'live' ? 'Going live\u2026' : 'Starting session\u2026'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Collection Entry */}
                <TouchableOpacity
                    style={styles.collectionCard}
                    onPress={() => router.replace('/(tabs)/collection')}
                    activeOpacity={0.7}
                >
                    <View style={styles.collectionCardLeft}>
                        <Ionicons
                            name="library-outline"
                            size={22}
                            color={THEME.colors.primary}
                            style={styles.collectionIcon}
                        />
                        <View>
                            <Text style={styles.collectionTitle}>{COPY.HOST_HOME_COLLECTION}</Text>
                            <Text style={styles.collectionMeta}>{syncTimeLabel}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={THEME.colors.textDim} />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    identity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    username: {
        color: THEME.colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: THEME.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    loadingIndicator: {
        marginTop: 16,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
    },
    historyCardContent: {
        flex: 1,
    },
    historyName: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: 4,
    },
    historyMeta: {
        fontSize: 13,
        color: THEME.colors.textDim,
    },
    seeAllLink: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: THEME.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: THEME.colors.textDim,
        textAlign: 'center',
        lineHeight: 20,
    },
    actionLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingLeft: 4,
    },
    actionLoadingText: {
        fontSize: 14,
        color: THEME.colors.textDim,
    },
    collectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 14,
        padding: 16,
    },
    collectionCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    collectionIcon: {
        marginRight: 14,
    },
    collectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: 2,
    },
    collectionMeta: {
        fontSize: 13,
        color: THEME.colors.textDim,
    },
});
