// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';

export default function TosScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Terms of Service</Text>
                <Text style={styles.body}>
                    Social Vinyl is a listening party app for personal use. By creating an account you agree to use the service responsibly and in accordance with applicable law.{'\n\n'}
                    We collect your email address solely for account verification and password recovery. We do not sell or share your data with third parties.{'\n\n'}
                    The app connects to your Discogs collection (with your permission) to power listening party features. You are responsible for compliance with Discogs terms of service.{'\n\n'}
                    We reserve the right to suspend accounts that abuse the service. This is an early-access product — features may change.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    content: { padding: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
    body: { color: THEME.colors.textDim, fontSize: 15, lineHeight: 24 },
    backButton: {
        marginTop: 32,
        backgroundColor: THEME.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
