import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { type DistanceUnit, type VolumeUnit, displayToKm, displayToLiters, kmToDisplay } from "../../utils/units";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";

export default function AddFuelLogModal({ visible, currentKm, unit, volumeUnit, onCancel, onSubmit }: {
  visible: boolean; currentKm: number; unit: DistanceUnit; volumeUnit: VolumeUnit; onCancel: () => void;
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
      Alert.alert("Invalid odometer reading", "Please enter a valid number of " + unit);
      return;
    }
    if (!Number.isFinite(volumeValue) || volumeValue <= 0) {
      Alert.alert("Invalid volume", "Please enter how much fuel was added, in " + volumeUnit);
      return;
    }
    const costValue = cost.trim() ? Number(cost) : null;
    onSubmit(
      Math.round(displayToKm(kmValue, unit)),
      displayToLiters(volumeValue, volumeUnit),
      costValue != null && Number.isFinite(costValue) ? costValue : null,
      fullTank
    );
    setVolume(""); setCost(""); setFullTank(true);
  }

  return (
    <FormSheet visible={visible} title="Add Fuel Fill-up" onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Add">
      <FormField label={`Odometer at fill-up (${unit})`} value={km} onChangeText={setKm} numeric />
      <FormField label={`Volume added (${volumeUnit})`} value={volume} onChangeText={setVolume} numeric allowDecimal />
      <FormField label="Cost" value={cost} onChangeText={setCost} placeholder="Optional" numeric allowDecimal />
      <View style={styles.fullTankRow}>
        <View>
          <Text style={styles.fullTankLabel}>Full tank</Text>
          <Text style={styles.fullTankHint}>Turn off for a partial fill-up</Text>
        </View>
        <Switch value={fullTank} onValueChange={setFullTank} />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  fullTankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fullTankLabel: { ...typography.body, color: colors.text },
  fullTankHint: { ...typography.caption, marginTop: spacing.xs },
});
