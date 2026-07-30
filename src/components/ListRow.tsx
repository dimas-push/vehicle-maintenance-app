import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";

interface ListRowProps {
  /** Leading icon-wrap or photo — a plain node since callers use both MaterialCommunityIcons and <Image>. */
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Trailing content before the chevron, e.g. a StatusBadge. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Defaults to true whenever onPress is set — pass false to suppress it (e.g. a row that's informational only). */
  showChevron?: boolean;
}

/** Navigation/summary row: leading visual + title/subtitle + optional trailing badge + chevron. Used for vehicle list cards, the loan summary row, and similar. */
export default function ListRow({ leading, title, subtitle, trailing, onPress, showChevron }: ListRowProps) {
  const chevronVisible = showChevron ?? Boolean(onPress);
  const content = (
    <>
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {chevronVisible && (
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} style={styles.chevron} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  rowPressed: { backgroundColor: colors.primarySoft },
  leading: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    overflow: "hidden",
  },
  body: { flex: 1 },
  title: { ...typography.body, fontWeight: "700" },
  subtitle: { ...typography.caption, marginTop: spacing.xs },
  chevron: { marginLeft: spacing.xs },
});
