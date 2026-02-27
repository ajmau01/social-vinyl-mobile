// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SessionCodeDisplay } from './SessionCodeDisplay';
import { COPY } from '@/constants/copy';

interface SessionInfoModalProps {
    visible: boolean;
    sessionName: string;
    hostName: string;
    joinCode: string;
    isBroadcast: boolean;
    isPermanent: boolean;
    onClose: () => void;
}

export function SessionInfoModal({
    visible,
    sessionName,
    hostName,
    joinCode,
    isBroadcast,
    isPermanent,
    onClose
}: SessionInfoModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{`${COPY.SESSION_NOUN} Info`}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={28} color={THEME.colors.textDim} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoCard}>
                        {isBroadcast && (
                            <View style={styles.broadcastBadge}>
                                <View style={styles.broadcastDot} />
                                <Text style={styles.broadcastText}>ON AIR</Text>
                            </View>
                        )}
                        <Text style={styles.sessionName}>{sessionName}</Text>
                        <Text style={styles.hostName}>Hosted by {hostName}</Text>
                    </View>

                    <Text style={styles.inviteLabel}>Invite Friends</Text>
                    <SessionCodeDisplay
                        joinCode={joinCode}
                        sessionName={sessionName}
                        isPermanent={isPermanent}
                    />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: THEME.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.glassBorder,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.colors.text,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 24,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    infoCard: {
        width: '100%',
        backgroundColor: THEME.colors.surface,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    broadcastBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.status.error + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    broadcastDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.status.error,
        marginRight: 6,
    },
    broadcastText: {
        color: THEME.colors.status.error,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    sessionName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    hostName: {
        fontSize: 16,
        color: THEME.colors.textDim,
    },
    inviteLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: THEME.colors.text,
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginLeft: 8,
    },
});
