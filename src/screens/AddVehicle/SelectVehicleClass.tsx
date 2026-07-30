import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function SelectVehicleClass() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Select Vehicle Class</Text>
      <Text style={[typography.body, styles.caption]}>Coming in M3 (add vehicle wizard).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  caption: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
});
