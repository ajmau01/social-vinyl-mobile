import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { COPY } from '@/constants/copy';

export default function AccountCreateScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{COPY.CREATE_ACCOUNT}</Text>

                <View style={styles.messageBox}>
                    <Text style={styles.messageTitle}>Guest Accounts Coming Soon</Text>
                    <Text style={styles.messageText}>
                        Persistent guest accounts (email/password) are currently in development.
                        For now, you can join any party instantly using just your display name.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Return to Welcome Screen</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 32,
    },
    messageBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 40,
        width: '100%',
    },
    messageTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: THEME.colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    messageText: {
        fontSize: 16,
        color: THEME.colors.textDim,
        lineHeight: 24,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});
