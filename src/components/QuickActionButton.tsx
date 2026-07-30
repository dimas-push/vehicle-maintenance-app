import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

/** Icon-in-circle + label below — the VehicleDetail quick-actions row (History/Fuel/Expenses/Trends). Distinct from IconButton: this always carries a visible label, so it isn't icon-only. */
export default function QuickActionButton({ icon, label, onPress }: QuickActionButtonProps) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xs },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...typography.microBold, fontWeight: "600", color: colors.textMuted },
});
