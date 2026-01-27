import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { wsService } from '@/services/WebSocketService';
import { NowPlayingBanner } from '@/components/NowPlayingBanner';
import { THEME } from '@/constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // Start connection when app launches
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* Persistent Banner Overlay */}
      <NowPlayingBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
