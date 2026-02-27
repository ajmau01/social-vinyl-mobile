import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface QRScannerProps {
    onCodeScanned: (code: string) => void;
    onClose: () => void;
}

export function QRScanner({ onCodeScanned, onClose }: QRScannerProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        let codeToPass = data;
        // Extract 5-char code from a URL (new URL() is unreliable in RN — use regex)
        const urlMatch = data.match(/[?&](?:code|join)=([A-Z0-9]{5})/i);
        if (urlMatch) {
            codeToPass = urlMatch[1].toUpperCase();
        }
        onCodeScanned(codeToPass);
    };

    if (hasPermission === null) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.text}>Requesting camera permission...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.text}>No access to camera</Text>
                <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Enter Code Manually</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Overlay UI */}
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan Party Code</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.scanAreaContainer}>
                    <View style={styles.scanArea} />
                </View>

                {scanned && (
                    <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
                        <Text style={styles.rescanText}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    text: {
        color: THEME.colors.textDim,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scanAreaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    rescanButton: {
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 30,
    },
    rescanText: {
        color: 'white',
        fontWeight: '600',
    },
});
