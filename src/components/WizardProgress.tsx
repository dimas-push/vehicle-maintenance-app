import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export default function WizardProgress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>
        Step {step} of {total}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  caption: { ...typography.caption, marginBottom: 2 },
  label: { ...typography.title, marginBottom: spacing.sm },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
});
