import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../context/AuthContext";
import { showErrorAlert } from "../../utils/errorAlert";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn, continueAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandWrap}>
          <View style={styles.brandBadge}>
            <Ionicons name="car-sport-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Vehicle Maintenance</Text>
          <Text style={styles.subtitle}>Log in to back up your data to the cloud</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={colors.textSubtle} />
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
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            placeholderTextColor={colors.textSubtle}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (pressed || submitting) && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log In"}</Text>
        </Pressable>

        <Pressable style={styles.linkWrap} onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextEmphasis}>Sign up</Text>
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.guestButton} onPress={continueAsGuest}>
          <Text style={styles.guestLinkText}>Continue without an account</Text>
          <Ionicons name="arrow-forward-outline" size={16} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.guestHint}>
          Your vehicle data stays on this device either way — an account isn't required to use the app.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  brandWrap: { alignItems: "center", marginBottom: spacing.xl },
  brandBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.subtitle, marginTop: spacing.xs, textAlign: "center" },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 4,
    ...shadow.card,
  },
  input: { flex: 1, paddingVertical: spacing.sm + 4, fontSize: 15, color: colors.text },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md - 2,
    alignItems: "center",
    marginTop: spacing.lg,
    ...shadow.card,
  },
  buttonPressed: { backgroundColor: colors.primaryDark, opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkWrap: { marginTop: spacing.md, alignItems: "center" },
  linkText: { color: colors.textMuted, fontSize: 14 },
  linkTextEmphasis: { color: colors.primary, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption },
  guestButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.sm },
  guestLinkText: { color: colors.textMuted, fontWeight: "600" },
  guestHint: { ...typography.caption, textAlign: "center", marginTop: spacing.xs },
});
