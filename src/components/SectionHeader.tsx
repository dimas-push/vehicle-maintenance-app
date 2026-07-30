import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../theme";

interface SectionHeaderProps {
  title: string;
  /** Optional secondary content shown next to the title (e.g. an inline status hint). */
  subtitle?: ReactNode;
  /** Optional trailing content — typically an IconButton for the section's primary action. */
  right?: ReactNode;
}

/**
 * Title row for a Card section: label + optional inline hint + optional
 * trailing action. A title-only API doesn't cover every section (Documents
 * needs an inline recall-check hint next to its title), so subtitle/right
 * are plain ReactNode escape hatches rather than a fixed icon+label shape.
 */
export default function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <Text style={typography.label}>{title}</Text>
        {subtitle}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
});
