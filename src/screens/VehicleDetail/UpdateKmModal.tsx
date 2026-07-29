import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import { type DistanceUnit, displayToKm, formatDistance, kmToDisplay } from "../../utils/units";

export default function UpdateKmModal({
  visible,
  currentKm,
  unit,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  currentKm: number;
  unit: DistanceUnit;
  onCancel: () => void;
  onSubmit: (newKm: number) => void;
}) {
  const currentDisplay = Math.round(kmToDisplay(currentKm, unit));
  const [value, setValue] = useState(String(currentDisplay));

  function handleSubmit() {
    const entered = Number(value);
    if (!Number.isFinite(entered) || entered < currentDisplay) {
      Alert.alert(
        "Invalid odometer reading",
        `The new reading must be a number and cannot be lower than ${formatDistance(currentKm, unit)}`
      );
      return;
    }
    onSubmit(Math.round(displayToKm(entered, unit)));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Update Current Odometer</Text>
          <Text style={styles.subtitle}>Last reading: {formatDistance(currentKm, unit)}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
              <Text style={styles.buttonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.lg, gap: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonGhost: { backgroundColor: "transparent" },
  buttonGhostText: { color: colors.textMuted, fontWeight: "600" },
});
