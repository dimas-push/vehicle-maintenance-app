import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

interface FABProps {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Bottom-right floating action button — was duplicated verbatim between VehicleList and ShopList. */
export default function FAB({ icon, onPress, accessibilityLabel }: FABProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.fab,
  },
  fabPressed: { backgroundColor: colors.primaryDark },
});
