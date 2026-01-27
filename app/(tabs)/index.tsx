import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Social Vinyl</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Mobile Satellite</Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  title: {
    color: THEME.colors.white,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: THEME.spacing.sm,
  },
  badge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.full,
  },
  badgeText: {
    color: THEME.colors.white,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
