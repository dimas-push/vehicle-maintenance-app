import { StyleSheet, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Restricts input to a numeric keyboard and strips non-numeric characters as the user types — the "numeric-safe" variant for km/cost/amount fields. */
  numeric?: boolean;
  /** Allows a single "." for decimal numeric fields (cost, volume). Ignored unless numeric is true. */
  allowDecimal?: boolean;
  multiline?: boolean;
  error?: string;
}

const NUMERIC_INTEGER = /[^0-9]/g;
const NUMERIC_DECIMAL = /[^0-9.]/g;

/** Label + TextInput, the pattern every Add/Edit form field reimplemented — with a built-in numeric-safe mode instead of each screen writing its own sanitizer. */
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
  allowDecimal = false,
  multiline = false,
  error,
}: FormFieldProps) {
  function handleChange(text: string) {
    if (!numeric) {
      onChangeText(text);
      return;
    }
    const pattern = allowDecimal ? NUMERIC_DECIMAL : NUMERIC_INTEGER;
    const sanitized = allowDecimal
      ? text.replace(pattern, "").replace(/(\..*)\./g, "$1")
      : text.replace(pattern, "");
    onChangeText(sanitized);
  }

  const keyboardType: KeyboardTypeOptions | undefined = numeric
    ? allowDecimal
      ? "decimal-pad"
      : "number-pad"
    : undefined;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
