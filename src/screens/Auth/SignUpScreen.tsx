import { useState } from "react";
import {
  Alert,
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

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({}: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandWrap}>
          <View style={styles.brandBadge}>
            <Ionicons name="person-add-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>Create an account to back up your vehicle data to the cloud.</Text>
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
            autoComplete="new-password"
            placeholder="At least 6 characters"
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

        <Text style={styles.label}>Confirm password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            placeholderTextColor={colors.textSubtle}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (pressed || submitting) && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleSignUp}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? "Creating account..." : "Create Account"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  brandWrap: { alignItems: "center", marginBottom: spacing.xl },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  subtitle: { ...typography.subtitle, textAlign: "center" },
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
});
