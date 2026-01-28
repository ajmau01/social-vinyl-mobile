import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { THEME } from '@/constants/theme';
import { Release, dbService } from '@/services/DatabaseService';
import { syncService } from '@/services/CollectionSyncService';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { Ionicons } from '@expo/vector-icons';

interface Track {
    position?: string;
    title: string;
    duration?: string;
}

interface ReleaseDetailsModalProps {
    visible: boolean;
    release: Release | null;
    onClose: () => void;
}

export const ReleaseDetailsModal = ({ visible, release, onClose }: ReleaseDetailsModalProps) => {
    const [tracks, setTracks] = useState<Track[] | null>(null);
    const [loading, setLoading] = useState(false);

    const { addItem, isInBin } = useListeningBinStore();
    const isAlreadyInBin = release ? isInBin(release.id) : false;

    useEffect(() => {
        if (visible && release) {
            if (release.tracks) {
                try {
                    setTracks(JSON.parse(release.tracks));
                } catch (e) {
                    setTracks([]);
                }
            } else {
                setTracks(null);
            }
        } else {
            setTracks(null);
            setLoading(false);
        }
    }, [visible, release]);

    const fetchTracks = async () => {
        if (!release) return;
        setLoading(true);
        const data = await syncService.fetchTracks(release.id);
        if (data) {
            setTracks(data);
        }
        setLoading(false);
    };

    const handleAddToBin = () => {
        if (release) {
            addItem(release);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    if (!release) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={styles.blur} />

                <View style={styles.container}>
                    {/* Header / Close Button */}
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={THEME.colors.textDim} />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Cover Art */}
                        <View style={styles.imageContainer}>
                            {release.thumb_url ? (
                                <Image
                                    source={{ uri: release.thumb_url }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.placeholder}>
                                    <Text style={styles.placeholderText}>No Image</Text>
                                </View>
                            )}
                        </View>

                        {/* Metadata */}
                        <View style={styles.info}>
                            <Text style={styles.title}>{release.title}</Text>
                            <Text style={styles.artist}>{release.artist}</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>
                                    {release.format || 'LP'} • {release.label || 'Unknown Label'} • {release.year || 'Unknown Year'}
                                </Text>
                            </View>
                        </View>

                        {/* Tracklist */}
                        <View style={styles.tracklist}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color={THEME.colors.primary} />
                                    <Text style={[styles.metaText, { marginTop: 8 }]}>Fetching tracks...</Text>
                                </View>
                            ) : tracks && tracks.length > 0 ? (
                                tracks.map((track, index: number) => (
                                    <View key={index} style={styles.trackRow}>
                                        <Text style={styles.trackNum}>{track.position || index + 1}</Text>
                                        <Text style={styles.trackTitle}>{track.title}</Text>
                                        <Text style={styles.trackDuration}>{track.duration || ''}</Text>
                                    </View>
                                ))
                            ) : (
                                <Pressable
                                    style={({ pressed }) => [styles.fetchButton, pressed && styles.pressed]}
                                    onPress={fetchTracks}
                                >
                                    <Ionicons name="list" size={16} color={THEME.colors.primary} />
                                    <Text style={styles.fetchButtonText}>View Tracks</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    pressed && styles.pressed,
                                    isAlreadyInBin && styles.disabledButton
                                ]}
                                onPress={handleAddToBin}
                                disabled={isAlreadyInBin}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {isAlreadyInBin ? 'In Bin ✓' : '+ Listening Bin'}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', // Standardized overlay
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.lg,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: THEME.spacing.sm,
    },
    closeButton: {
        padding: THEME.spacing.xs,
    },
    scrollContent: {
        padding: THEME.spacing.lg,
        paddingTop: 0,
        alignItems: 'center',
    },
    imageContainer: {
        width: 200,
        height: 200,
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
        marginBottom: THEME.spacing.lg,
        backgroundColor: THEME.colors.surfaceLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: THEME.colors.textDim,
    },
    info: {
        alignItems: 'center',
        marginBottom: THEME.spacing.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.colors.white,
        textAlign: 'center',
        marginBottom: THEME.spacing.xs,
    },
    artist: {
        fontSize: 16,
        color: THEME.colors.primary, // Using primary color for artist inspired by WebApp link style
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    metaRow: {
        marginTop: THEME.spacing.xs,
        paddingTop: THEME.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.glassBorder,
        width: '100%',
        alignItems: 'center',
    },
    metaText: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
    tracklist: {
        width: '100%',
        marginBottom: THEME.spacing.lg,
        paddingHorizontal: THEME.spacing.sm,
    },
    trackRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glass,
        alignItems: 'center',
    },
    trackNum: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
        width: 30,
        fontSize: 12,
    },
    trackTitle: {
        color: THEME.colors.text,
        flex: 1,
        fontSize: 14,
    },
    trackDuration: {
        color: THEME.colors.textDim,
        fontSize: 12,
    },
    actions: {
        width: '100%',
        gap: THEME.spacing.md,
    },
    secondaryButton: {
        backgroundColor: THEME.colors.glass,
        paddingVertical: 12,
        borderRadius: THEME.radius.full,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    secondaryButtonText: {
        color: THEME.colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: THEME.colors.glass,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }]
    },
    loadingContainer: {
        padding: THEME.spacing.lg,
        alignItems: 'center',
    },
    fetchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: THEME.spacing.md,
        backgroundColor: THEME.colors.glass,
        borderRadius: THEME.radius.md,
        gap: THEME.spacing.xs,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        marginTop: THEME.spacing.sm,
    },
    fetchButtonText: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    }
});
