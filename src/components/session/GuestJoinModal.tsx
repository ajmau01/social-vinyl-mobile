import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { COPY } from '@/constants/copy';

interface GuestJoinModalProps {
    visible: boolean;
    onSubmit: (displayName: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function GuestJoinModal({ visible, onSubmit, onCancel, loading = false }: GuestJoinModalProps) {
    const [name, setName] = useState('');
    const [tab, setTab] = useState<'skip' | 'account'>('skip');

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
            animationType="slide"
            onRequestClose={onCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.card}>
                    <TouchableOpacity 
                        testID="modal-close-button"
                        style={styles.closeButton} 
                        onPress={onCancel} 
                        disabled={loading}
                    >
                        <Ionicons name="close" size={24} color={THEME.colors.textDim} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name="people" size={40} color={THEME.colors.primary} />
                    </View>
                    
                    <Text style={styles.title}>{COPY.GUEST_JOIN_TITLE}</Text>
                    <Text style={styles.subtitle}>{COPY.GUEST_JOIN_SUBTITLE}</Text>

                    <View style={styles.tabBar}>
                        <TouchableOpacity 
                            style={[styles.tab, tab === 'skip' && styles.activeTab]} 
                            onPress={() => setTab('skip')}
                            disabled={loading}
                        >
                            <Text style={[styles.tabText, tab === 'skip' && styles.activeTabText]}>{COPY.QUICK_JOIN}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, tab === 'account' && styles.activeTab]} 
                            onPress={() => setTab('account')}
                            disabled={loading}
                        >
                            <Text style={[styles.tabText, tab === 'account' && styles.activeTabText]}>{COPY.CREATE_ACCOUNT}</Text>
                        </TouchableOpacity>
                    </View>

                    {tab === 'skip' ? (
                        <View style={styles.form}>
                            <Text style={styles.label}>{COPY.DISPLAY_NAME}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Disco Dave"
                                placeholderTextColor={THEME.colors.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                maxLength={20}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="done"
                                editable={!loading}
                            />
                            <Text style={styles.hint}>{COPY.QUICK_JOIN_HINT}</Text>

                            <TouchableOpacity
                                style={[styles.submitButton, (!name.trim() || loading) && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={!name.trim() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{COPY.JOIN_AS_GUEST}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <View style={styles.stubContainer}>
                                <Ionicons name="construct-outline" size={32} color={THEME.colors.textMuted} />
                                <Text style={styles.stubTitle}>{COPY.CREATE_ACCOUNT_STUB_TITLE}</Text>
                                <Text style={styles.stubText}>
                                    {COPY.CREATE_ACCOUNT_STUB_DESC}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setTab('skip')}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>{COPY.USE_QUICK_JOIN}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    card: {
        backgroundColor: THEME.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: THEME.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textDim,
        marginBottom: 24,
        textAlign: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        width: '100%',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: THEME.colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.colors.textDim,
    },
    activeTabText: {
        color: THEME.colors.primary,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.colors.textDim,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        backgroundColor: THEME.colors.background,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: THEME.colors.text,
        marginBottom: 12,
    },
    hint: {
        fontSize: 13,
        color: THEME.colors.textMuted,
        marginBottom: 24,
        marginLeft: 4,
    },
    submitButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: THEME.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    stubContainer: {
        backgroundColor: THEME.colors.background,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
        borderStyle: 'dashed',
    },
    stubTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    stubText: {
        fontSize: 14,
        color: THEME.colors.textDim,
        textAlign: 'center',
        lineHeight: 20,
    },
});
