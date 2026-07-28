import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from './src/db';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => setDbError(String(err)));
  }, []);

  if (dbError) {
    return (
      <View style={styles.container}>
        <Text>Gagal membuka database: {dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.container}>
        <Text>Memuat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
