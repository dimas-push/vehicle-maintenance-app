import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function FuelLogScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Fuel Log</Text>
      <Text style={[typography.body, styles.caption]}>Coming in M4 (secondary feature screens).</Text>
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
