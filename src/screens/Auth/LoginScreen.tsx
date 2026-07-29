import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../context/AuthContext";
import { showErrorAlert } from "../../utils/errorAlert";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      showErrorAlert("Couldn't log in", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Maintenance</Text>
        <Text style={styles.subtitle}>Log in to continue</Text>
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="you@example.com"
        placeholderTextColor={colors.textSubtle}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholderTextColor={colors.textSubtle}
      />

      <Pressable
        style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
        onPress={handleLogin}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log In"}</Text>
      </Pressable>

      <Pressable style={styles.linkWrap} onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  header: { marginBottom: spacing.xl, alignItems: "center" },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.subtitle, marginTop: spacing.xs },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 15,
    color: colors.text,
    ...shadow.card,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md - 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonPressed: { backgroundColor: colors.primaryDark, opacity: 0.9 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkWrap: { marginTop: spacing.md, alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "600" },
});
