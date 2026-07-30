import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography } from "../theme";

interface StatusBadgeProps {
  label: string;
  /**
   * Background/foreground pair — callers own the color pairing rather than
   * this component guessing a semantic tone. Pass a soft-tint pair (e.g.
   * STATUS_STYLE[status] for schedule/document status) for the common case,
   * or theme colors directly (e.g. {bg: colors.danger, fg: colors.onPrimary})
   * for a solid badge like "Open Recall".
   */
  bg: string;
  fg: string;
}

/** Small pill badge — structure only; two real usages (soft status tint, solid danger) confirmed this split is needed rather than one fixed look. */
export default function StatusBadge({ label, bg, fg }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.microBold, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
