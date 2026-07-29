import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../context/AuthContext";
import { showErrorAlert } from "../../utils/errorAlert";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({}: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) return;
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter your password");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      // No further navigation needed: onAuthStateChanged flips AppNavigator
      // over to the main app automatically once the account is created.
    } catch (err) {
      showErrorAlert("Couldn't create account", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
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
        autoComplete="new-password"
        placeholder="At least 6 characters"
        placeholderTextColor={colors.textSubtle}
      />

      <Text style={styles.label}>Confirm password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholderTextColor={colors.textSubtle}
      />

      <Pressable
        style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
        onPress={handleSignUp}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? "Creating account..." : "Create Account"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
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
});
