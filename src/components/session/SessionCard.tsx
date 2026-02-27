// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SessionCard as ISessionCard } from '@/types';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SessionCardProps {
    session: ISessionCard;
    isActiveCurrentSession: boolean;
    onJoin: () => void;
    onEnd: () => void;
    onShare: () => void;
    onToggleBroadcast: () => void;
}

export function SessionCard({
    session,
    isActiveCurrentSession,
    onJoin,
    onEnd,
    onShare,
    onToggleBroadcast
}: SessionCardProps) {
    return (
        <View style={[styles.card, isActiveCurrentSession && styles.activeCard]}>
            <View style={styles.header}>
                <View style={styles.titleInfo}>
                    <Text style={styles.name}>{session.name}</Text>
                    {session.permanent && (
                        <View style={styles.permanentBadge}>
                            <Ionicons name="infinite" size={12} color={THEME.colors.primary} />
                            <Text style={styles.badgeText}>Family Pass</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.code}>{session.code}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: session.active ? THEME.colors.status.success : THEME.colors.textMuted }]} />
                    <Text style={styles.statusText}>{session.active ? 'Active' : 'Inactive'}</Text>
                    {session.isBroadcast && (
                        <View style={styles.broadcastBadge}>
                            <View style={styles.broadcastDot} />
                            <Text style={styles.broadcastText}>ON AIR</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={onJoin}
                >
                    <Ionicons name={isActiveCurrentSession ? "log-in" : "enter-outline"} size={16} color="white" />
                    <Text style={styles.primaryButtonText}>
                        {isActiveCurrentSession ? "Return to Vault" : "View Vault"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionRowRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={onToggleBroadcast}>
                        <Ionicons
                            name={session.isBroadcast ? "radio" : "radio-outline"}
                            size={20}
                            color={session.isBroadcast ? THEME.colors.status.error : THEME.colors.textDim}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={onShare}>
                        <Ionicons name="share-social-outline" size={20} color={THEME.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={onEnd}>
                        <Ionicons name="trash-outline" size={20} color={THEME.colors.status.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activeCard: {
        borderColor: THEME.colors.primary,
        borderWidth: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 4,
    },
    permanentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.colors.primary,
        marginLeft: 4,
    },
    code: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.colors.textDim,
        backgroundColor: THEME.colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        letterSpacing: 2,
    },
    footer: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: THEME.colors.textDim,
    },
    broadcastBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.status.error + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 12,
    },
    broadcastDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: THEME.colors.status.error,
        marginRight: 4,
    },
    broadcastText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: THEME.colors.status.error,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: THEME.colors.glassBorder,
        paddingTop: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    actionRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 8,
        marginLeft: 4,
        backgroundColor: THEME.colors.background,
        borderRadius: 8,
    },
});
