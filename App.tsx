import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from './src/db';
import { seedDummyVehiclesIfEmpty } from './src/db/seedDummyData';
import { initNotifications } from './src/services/notifications';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, spacing, typography } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(async () => {
        await initNotifications();
        if (__DEV__) await seedDummyVehiclesIfEmpty();
        setDbReady(true);
      })
      .catch((err) => setDbError(String(err)));
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
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="dark" />
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
