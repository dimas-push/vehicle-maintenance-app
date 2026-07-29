import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import { type DistanceUnit, type VolumeUnit, displayToKm, displayToLiters, kmToDisplay } from "../../utils/units";

export default function AddFuelLogModal({
  visible,
  currentKm,
  unit,
  volumeUnit,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  currentKm: number;
  unit: DistanceUnit;
  volumeUnit: VolumeUnit;
  onCancel: () => void;
  onSubmit: (filledAtKm: number, volumeLiters: number, cost: number | null, fullTank: boolean) => void;
}) {
  const [km, setKm] = useState(String(Math.round(kmToDisplay(currentKm, unit))));
  const [volume, setVolume] = useState("");
  const [cost, setCost] = useState("");
  const [fullTank, setFullTank] = useState(true);

  function handleSubmit() {
    const kmValue = Number(km);
    const volumeValue = Number(volume);
    if (!Number.isFinite(kmValue) || kmValue < 0) {
      Alert.alert("Invalid odometer reading", `Please enter a valid number of ${unit}`);
      return;
    }
    if (!Number.isFinite(volumeValue) || volumeValue <= 0) {
      Alert.alert("Invalid volume", `Please enter how much fuel was added, in ${volumeUnit}`);
      return;
    }
    const costValue = cost.trim() ? Number(cost) : null;
    onSubmit(
      Math.round(displayToKm(kmValue, unit)),
      displayToLiters(volumeValue, volumeUnit),
      costValue != null && Number.isFinite(costValue) ? costValue : null,
      fullTank
    );
    setVolume("");
    setCost("");
    setFullTank(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Fuel Fill-up</Text>

          <Text style={styles.label}>Odometer at fill-up ({unit})</Text>
          <TextInput style={styles.input} value={km} onChangeText={setKm} keyboardType="numeric" />

          <Text style={styles.label}>Volume added ({volumeUnit})</Text>
          <TextInput
            style={styles.input}
            value={volume}
            onChangeText={setVolume}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            autoFocus
          />

          <Text style={styles.label}>Cost (optional)</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Full tank</Text>
              <Text style={styles.switchHint}>Turn off for a partial fill-up</Text>
            </View>
            <Switch value={fullTank} onValueChange={setFullTank} />
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
              <Text style={styles.buttonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Add</Text>
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
  title: { ...typography.title, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  switchLabel: { ...typography.body, fontWeight: "600" },
  switchHint: { ...typography.caption, marginTop: 2 },
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
