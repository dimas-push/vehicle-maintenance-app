import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The generic elevated container every screen needs — surface-colored, shadowed, rounded. */
export default function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
});
