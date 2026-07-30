import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

// M0 scope: navigation shell + the Firebase-configured/guest-mode fallback
// only. Database init, notification setup, and unit preferences are ported
// in M1/M3 once the data layer and those screens exist.
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ErrorBoundary>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
