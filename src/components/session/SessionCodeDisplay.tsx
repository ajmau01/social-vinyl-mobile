// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COPY } from '@/constants/copy';

interface SessionCodeDisplayProps {
    joinCode: string;
    sessionName: string;
    isPermanent?: boolean;
}

export function SessionCodeDisplay({ joinCode, sessionName, isPermanent = false }: SessionCodeDisplayProps) {
    const inviteUrl = `https://socialvinyl.app/join?code=${joinCode}`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join my Social Vinyl ${COPY.SESSION_NOUN_SENTENCE} "${sessionName}"! Use code: ${joinCode} or tap the link: ${inviteUrl}`,
                url: inviteUrl, // iOS uses this explicitly
                title: 'Join my Social Vinyl Party',
            });
        } catch (error) {
            console.error('Error sharing session code:', error);
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(joinCode);
        // In a real app we might want to pop a toast saying "Copied!"
    };

    return (
        <View style={styles.container}>
            <View style={styles.qrContainer}>
                <QRCode
                    value={joinCode}
                    size={200}
                    color={THEME.colors.text}
                    backgroundColor={THEME.colors.surface}
                />
            </View>

            <View style={styles.codeRow}>
                <Text style={styles.codeText}>{joinCode}</Text>
                <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
                    <Ionicons name="copy-outline" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
            </View>

            {isPermanent && (
                <View style={styles.permanentBadge}>
                    <Ionicons name="infinite-outline" size={16} color={THEME.colors.primary} />
                    <Text style={styles.permanentText}>Family Pass Active</Text>
                </View>
            )}

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="white" style={styles.shareIcon} />
                <Text style={styles.shareButtonText}>Share Invite Link</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: THEME.colors.surface,
        borderRadius: 16,
        margin: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 24,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    codeText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: THEME.colors.text,
        letterSpacing: 4,
        marginRight: 12,
    },
    iconButton: {
        padding: 8,
    },
    permanentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 24,
    },
    permanentText: {
        color: THEME.colors.primary,
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 12,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        width: '100%',
        justifyContent: 'center',
    },
    shareIcon: {
        marginRight: 8,
    },
    shareButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
