// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSessionStore } from '@/store/useSessionStore';
import { THEME } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Handles the Discogs OAuth callback deep link.
 * Expo Router routes socialvinyl://discogs-callback?oauth_token=...&oauth_verifier=...
 * here. The component calls /api/discogs-auth/complete and navigates away.
 */
export default function DiscogsCallbackScreen() {
    const router = useRouter();
    const { oauth_token, oauth_verifier } = useLocalSearchParams<{
        oauth_token?: string;
        oauth_verifier?: string;
    }>();

    useEffect(() => {
        const store = useSessionStore.getState();
        const appUsername = store.username;

        if (!oauth_token || !oauth_verifier || !appUsername) {
            router.replace('/link-discogs?error=callback_failed');
            return;
        }

        store.setPendingOAuthToken(null);

        fetch(`${API_URL}/api/discogs-auth/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oauthToken: oauth_token,
                oauthVerifier: oauth_verifier,
                appUsername,
            }),
        })
            .then(async res => {
                if (!res.ok) throw new Error('complete failed: HTTP ' + res.status);
                return res.json();
            })
            .then((data: { discogsUsername: string }) => {
                store.setDiscogsLinked(true);
                store.setDiscogsUsername(data.discogsUsername);
                router.replace('/(tabs)/collection');
            })
            .catch(() => {
                router.replace('/link-discogs?error=callback_failed');
            });
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.colors.background,
    },
});
