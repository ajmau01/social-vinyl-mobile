import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useListeningBinStore } from '@/store/useListeningBinStore';
import { NowPlayingBanner } from '@/components/NowPlayingBanner';
import { listeningBinSyncService } from '@/services/ListeningBinSyncService';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    // Add extra padding for bottom safe area, or default to 10 if none (non-X iPhones/Android)
    const bottomPadding = Math.max(insets.bottom, 10);
    const tabBarHeight = THEME.layout.tabBarHeight + bottomPadding;
    // Issue #126: Initialize Bin Sync Service
    useEffect(() => {
        listeningBinSyncService.init();
    }, []);

    const binItems = useListeningBinStore((state) => state.items);
    const binCount = binItems.length;

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: [
                        styles.tabBar,
                        { height: tabBarHeight, paddingBottom: bottomPadding }
                    ],
                    tabBarActiveTintColor: THEME.colors.primary,
                    tabBarInactiveTintColor: THEME.colors.textDim,
                    tabBarBackground: () => (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.colors.surface }]} />
                    ),
                }}
            >
                <Tabs.Screen
                    name="collection"
                    options={{
                        title: 'Collection',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="albums-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="bin"
                    options={{
                        title: 'Bin',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="musical-notes" size={size} color={color} />
                        ),
                        tabBarBadge: binCount > 0 ? binCount : undefined,
                        tabBarBadgeStyle: {
                            backgroundColor: THEME.colors.primary,
                            color: 'white',
                        }
                    }}
                />
            </Tabs>

            {/* Now Playing Banner - sits above tab bar */}
            <View style={[styles.bannerContainer, { bottom: tabBarHeight }]}>
                <NowPlayingBanner />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: 'transparent',
        paddingTop: 10, // Top spacing for icon clarity
    },
    bannerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
});
