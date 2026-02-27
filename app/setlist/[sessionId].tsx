// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';

import { useServices } from '@/contexts/ServiceContext';
import { SessionHistory, SessionPlay } from '@/types';
import { logger } from '@/utils/logger';

// --- SetlistEntry Component ---

interface SetlistEntryProps {
    play: SessionPlay;
    index: number;
    onPress: (play: SessionPlay) => void;
}

const SetlistEntry: React.FC<SetlistEntryProps> = ({ play, index, onPress }) => {
    const formattedTime = format(new Date(play.played_at), 'h:mm a');

    return (
        <TouchableOpacity
            style={styles.entryContainer}
            onPress={() => onPress(play)}
            activeOpacity={0.7}
        >
            <View style={styles.indexContainer}>
                <Text style={styles.indexText}>{index}</Text>
            </View>

            <View style={styles.artContainer}>
                {play.album_art_url ? (
                    <Image
                        source={{ uri: play.album_art_url }}
                        style={styles.albumArt}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={styles.albumArtPlaceholder}>
                        <Ionicons name="disc" size={24} color="#64748b" />
                    </View>
                )}
            </View>

            <View style={styles.entryContent}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                    {play.release_title || 'Unknown Title'}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                    {play.artist || 'Unknown Artist'}
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.timeText}>{formattedTime}</Text>
                    {play.picked_by_username && (
                        <>
                            <Text style={styles.metaDot}> • </Text>
                            <Text style={styles.attributionText} numberOfLines={1}>
                                Added by <Text style={styles.attributionName}>{play.picked_by_username}</Text>
                            </Text>
                        </>
                    )}
                </View>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={() => onPress(play)}>
                <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

// --- Setlist Screen ---

export default function SetlistScreen() {
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    const router = useRouter();
    const { databaseService } = useServices();
    const insets = useSafeAreaInsets();

    const [sessionConfig, setSessionConfig] = useState<SessionHistory | null>(null);
    const [plays, setPlays] = useState<SessionPlay[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSetlist = useCallback(async () => {
        if (!sessionId) return;

        try {
            setIsLoading(true);

            const session = await databaseService.getSessionById(sessionId);
            if (session) {
                setSessionConfig(session);
            }

            const setlist = await databaseService.getSessionSetlist(sessionId);
            logger.info('[SetlistScreen] Fetched setlist length:', setlist.length);

            setPlays(setlist);
        } catch (error) {
            logger.error('[SetlistScreen] Failed to load setlist', error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, databaseService]);

    useEffect(() => {
        loadSetlist();
    }, [loadSetlist]);

    const handleEntryPress = useCallback((play: SessionPlay) => {
        // TBD: Could open a modal to view release details or "Listen Along"
        logger.debug('[SetlistScreen] Tapped play:', play.id);
    }, []);

    const renderEmpty = () => {
        if (isLoading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={64} color="#cbd5e1" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Empty Setlist</Text>
                <Text style={styles.emptyText}>
                    No records were played during this session.
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
                    <Text style={styles.title} numberOfLines={1}>
                        {sessionConfig?.session_name || 'Setlist'}
                    </Text>
                    {sessionConfig && (
                        <Text style={styles.subtitle}>
                            {format(new Date(sessionConfig.started_at), 'MMM d, yyyy')} • {plays.length} records
                        </Text>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f8fafc" />
                </View>
            ) : (
                <FlatList
                    data={plays}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <SetlistEntry
                            play={item}
                            index={index + 1}
                            onPress={handleEntryPress}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    subtitle: {
        fontSize: 13,
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

    // SetlistEntry styles
    entryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    indexContainer: {
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    artContainer: {
        width: 48,
        height: 48,
        marginRight: 12,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#1e293b',
    },
    albumArt: {
        width: '100%',
        height: '100%',
    },
    albumArtPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#334155',
    },
    entryContent: {
        flex: 1,
        justifyContent: 'center',
    },
    trackTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 2,
    },
    artistName: {
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#64748b',
    },
    metaDot: {
        fontSize: 12,
        color: '#64748b',
    },
    attributionText: {
        fontSize: 12,
        color: '#64748b',
        flexShrink: 1,
    },
    attributionName: {
        fontWeight: '500',
        color: '#94a3b8',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    }
});
