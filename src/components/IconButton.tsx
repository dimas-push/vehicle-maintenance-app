import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

interface IconButtonProps {
  /** The icon element itself (e.g. <Ionicons name="pencil-outline" size={22} color={colors.primary} />). */
  icon: ReactNode;
  onPress: () => void;
  /** Required, not optional — an icon-only button with no accessibilityLabel is a structural accessibility bug, not a style choice. */
  accessibilityLabel: string;
  disabled?: boolean;
}

/** Icon-only touch target — bakes in accessibilityRole + a mandatory label so this can't be forgotten per call site (it was, repeatedly, in the old code). */
export default function IconButton({ icon, onPress, accessibilityLabel, disabled = false }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
