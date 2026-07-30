import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { isFirebaseConfigured } from "../services/firebase";
import RootNavigator from "./RootNavigator";
import AuthNavigator from "./AuthNavigator";
import { colors } from "../theme";

export default function AppNavigator() {
  const { user, loading, isGuest } = useAuth();

  // No Firebase project configured (no .env yet) — the app is local-only
  // regardless, so behave exactly like guest mode rather than blocking
  // everything behind a setup screen. Login/signup simply won't be offered
  // until .env is filled in (see .env.example). This check must run before
  // the loading/user checks below — it shipped as a bug once, gating the
  // entire app behind a "sign-in isn't set up" screen (see AGENTS.md).
  if (!isFirebaseConfigured) {
    return <RootNavigator />;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return user || isGuest ? <RootNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
