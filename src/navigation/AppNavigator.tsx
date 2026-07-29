import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { isFirebaseConfigured } from "../services/firebase";
import RootNavigator from "./RootNavigator";
import AuthNavigator from "./AuthNavigator";
import { colors, spacing, typography } from "../theme";

export default function AppNavigator() {
  const { user, loading, isGuest } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
        <Text style={styles.title}>Sign-in isn't set up yet</Text>
        <Text style={styles.detail}>
          Copy .env.example to .env and fill in your Firebase project's config to enable
          account sign-in.
        </Text>
      </View>
    );
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
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: { ...typography.title, marginTop: spacing.sm, textAlign: "center" },
  detail: { ...typography.caption, marginTop: spacing.xs, textAlign: "center" },
});
