import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from './src/db';
import { seedDummyVehiclesIfEmpty } from './src/db/seedDummyData';
import { initNotifications } from './src/services/notifications';
import { UnitPreferenceProvider } from './src/context/UnitPreferenceContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors, spacing, typography } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  // Web preview needs SharedArrayBuffer (crossOriginIsolated) for expo-sqlite,
  // which this project's dev server can't reliably grant to the top-level
  // document — see metro.config.js. When that happens, getDb() hangs forever
  // rather than rejecting, so a timeout is the only way to catch it and point
  // the user at Expo Go instead of leaving them on a spinner indefinitely.
  const [webTimedOut, setWebTimedOut] = useState(false);

  useEffect(() => {
    const timeoutId =
      Platform.OS === 'web' ? setTimeout(() => setWebTimedOut(true), 10000) : undefined;

    getDb()
      .then(async () => {
        await initNotifications();
        if (__DEV__) await seedDummyVehiclesIfEmpty();
        setDbReady(true);
      })
      .catch((err) => setDbError(String(err)))
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (dbError) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorTitle}>Failed to open the database</Text>
        <Text style={styles.errorDetail}>{dbError}</Text>
      </View>
    );
  }

  if (webTimedOut && !dbReady) {
    return (
      <View style={styles.container}>
        <Ionicons name="phone-portrait-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Web preview isn&apos;t loading</Text>
        <Text style={styles.errorDetail}>
          This app&apos;s offline database needs a browser feature that isn&apos;t reliably available in web
          preview yet. Use Expo Go on your phone for the full app.
        </Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <UnitPreferenceProvider>
        <AuthProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </AuthProvider>
        <StatusBar style="dark" />
      </UnitPreferenceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: { ...typography.subtitle, marginTop: spacing.sm },
  errorTitle: { ...typography.title, marginTop: spacing.sm, textAlign: 'center' },
  errorDetail: { ...typography.caption, marginTop: spacing.xs, textAlign: 'center' },
});
