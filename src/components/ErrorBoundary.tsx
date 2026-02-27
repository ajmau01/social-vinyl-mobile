// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { logger } from '@/utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches rendering errors in child components
 * and displays a fallback UI instead of crashing the app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to our diagnostic logger
        logger.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // In production, this is where we would also send to Sentry
    }

    handleRestart = () => {
        // Basic reload mechanism (simple state reset for now)
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            The application encountered an unexpected error and needs to restart.
                        </Text>
                        {__DEV__ && (
                            <Text style={styles.debugInfo}>
                                {this.state.error?.toString()}
                            </Text>
                        )}
                        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                            <Text style={styles.buttonText}>Reload Application</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: THEME.colors.surface,
        padding: 24,
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.glassBorder,
    },
    title: {
        color: THEME.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        color: THEME.colors.textDim,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    debugInfo: {
        color: THEME.colors.status.error,
        fontSize: 12,
        fontFamily: 'monospace',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: 8,
        borderRadius: 4,
        marginBottom: 24,
        width: '100%',
    },
    button: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: '#000000',
        fontWeight: '600',
        fontSize: 16,
    },
});
