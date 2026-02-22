import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { COPY } from '@/constants/copy';

interface LobbyModalProps {
    visible: boolean;
    onSubmit: (displayName: string) => void;
    onCancel: () => void;
}

export function LobbyModal({ visible, onSubmit, onCancel }: LobbyModalProps) {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        const trimmed = name.trim();
        if (trimmed.length > 0) {
            onSubmit(trimmed);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="person-circle-outline" size={48} color={THEME.colors.primary} />
                    </View>
                    <Text style={styles.title}>Welcome to the Party!</Text>
                    <Text style={styles.subtitle}>What should we call you at the party?</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Your Display Name"
                        placeholderTextColor={THEME.colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        maxLength={20}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="done"
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, !name.trim() && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={!name.trim()}
                        >
                            <Text style={styles.submitButtonText}>Join Party</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: THEME.colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: THEME.colors.background,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 8,
        padding: 16,
        fontSize: 18,
        color: THEME.colors.text,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    cancelButtonText: {
        color: THEME.colors.textDim,
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        backgroundColor: THEME.colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
