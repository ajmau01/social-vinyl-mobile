// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';

export interface ToastNotificationProps {
    message: string;
    visible: boolean;
    variant?: 'warning' | 'success' | 'info';
    duration?: number; // ms, default 3000
    onDismiss: () => void;
}

export function ToastNotification({ message, visible, variant = 'info', duration = 3000, onDismiss }: ToastNotificationProps) {
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            const t = setTimeout(onDismiss, duration);
            return () => clearTimeout(t);
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const bgColor = variant === 'warning' ? '#f59e0b' : variant === 'success' ? '#22c55e' : THEME.colors.surface;

    return (
        <Animated.View style={[styles.container, { backgroundColor: bgColor, transform: [{ translateY }], opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
            <Pressable onPress={onDismiss} style={styles.inner}>
                <Text style={styles.message}>{message}</Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: 12, zIndex: 1000, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    inner: { padding: 14 },
    message: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
