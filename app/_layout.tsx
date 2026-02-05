import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useWebSocket } from '@/hooks';

export default function RootLayout() {
  const { username, authToken } = useSessionStore();
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    // Manage Connection Lifecycle using the hook's actions
    if (username) {
      connect();
    } else {
      disconnect();
    }
  }, [username, authToken, connect, disconnect]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
