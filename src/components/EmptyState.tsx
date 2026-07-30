import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

interface EmptyStateProps {
  /** The icon element itself (e.g. <MaterialCommunityIcons name="motorbike" size={40} color={colors.primary} />) — kept as a node rather than a name prop since empty states draw from more than one icon family. */
  icon: ReactNode;
  title: string;
  caption: string;
}

/** Icon-in-circle + title + caption — the identical empty-list pattern used across list screens. */
export default function EmptyState({ icon, title, caption }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  caption: { ...typography.subtitle, textAlign: "center" },
});
