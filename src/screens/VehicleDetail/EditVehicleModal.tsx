import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { FuelType, Transmission, VehicleClass } from "../../types/models";
import { FUEL_TYPE_LABEL, TRANSMISSION_LABEL } from "../../utils/vehicleSpecs";
import { colors, radius, spacing, typography } from "../../theme";

export interface EditVehicleSubmitValues {
  nickname: string;
  plateNumber: string | null;
  vin: string | null;
  year: number | null;
  color: string | null;
  engineSize: string | null;
  transmission: Transmission | null;
  fuelType: FuelType | null;
}

const TRANSMISSION_OPTIONS = (Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((value) => ({
  value,
  label: TRANSMISSION_LABEL[value],
}));

const FUEL_TYPE_OPTIONS = (Object.keys(FUEL_TYPE_LABEL) as FuelType[]).map((value) => ({
  value,
  label: FUEL_TYPE_LABEL[value],
}));

export default function EditVehicleModal({
  visible,
  vehicleClass,
  nickname: initialNickname,
  plateNumber: initialPlateNumber,
  vin: initialVin,
  year: initialYear,
  color: initialColor,
  engineSize: initialEngineSize,
  transmission: initialTransmission,
  fuelType: initialFuelType,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  vehicleClass: VehicleClass;
  nickname: string;
  plateNumber: string | null;
  vin: string | null;
  year: number | null;
  color: string | null;
  engineSize: string | null;
  transmission: Transmission | null;
  fuelType: FuelType | null;
  onCancel: () => void;
  onSubmit: (values: EditVehicleSubmitValues) => void;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [plateNumber, setPlateNumber] = useState(initialPlateNumber ?? "");
  const [vin, setVin] = useState(initialVin ?? "");
  const [year, setYear] = useState(initialYear ? String(initialYear) : "");
  const [color, setColor] = useState(initialColor ?? "");
  const [engineSize, setEngineSize] = useState(initialEngineSize ?? "");
  const [transmission, setTransmission] = useState<Transmission | null>(initialTransmission);
  const [fuelType, setFuelType] = useState<FuelType | null>(initialFuelType);
  const isCar = vehicleClass === "car";

  function handleSubmit() {
    if (!nickname.trim()) {
      Alert.alert("Vehicle name is required", "Please enter a name for this vehicle");
      return;
    }
    const yearValue = year.trim() ? Number(year) : null;
    if (yearValue != null && (!Number.isFinite(yearValue) || yearValue < 1900 || yearValue > 2100)) {
      Alert.alert("Invalid year", "Please enter a valid 4-digit year, or leave it blank");
      return;
    }
    onSubmit({
      nickname: nickname.trim(),
      plateNumber: plateNumber.trim() || null,
      vin: vin.trim() || null,
      year: yearValue,
      color: color.trim() || null,
      engineSize: engineSize.trim() || null,
      transmission,
      fuelType,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Edit Vehicle</Text>

            <Text style={styles.label}>Vehicle name</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              autoFocus
            />

            <Text style={styles.label}>License plate (optional)</Text>
            <TextInput
              style={styles.input}
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>VIN / chassis number (optional)</Text>
            <TextInput
              style={styles.input}
              value={vin}
              onChangeText={setVin}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Year (optional)</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              placeholder={isCar ? "2022" : "2023"}
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Color (optional)</Text>
            <TextInput
              style={styles.input}
              value={color}
              onChangeText={setColor}
              placeholder="e.g. Blue"
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Engine size (optional)</Text>
            <TextInput
              style={styles.input}
              value={engineSize}
              onChangeText={setEngineSize}
              placeholder={isCar ? "e.g. 2.0L" : "e.g. 150cc"}
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Transmission (optional)</Text>
            <View style={styles.chipRow}>
              {TRANSMISSION_OPTIONS.map((option) => {
                const selected = transmission === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setTransmission(selected ? null : option.value)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Fuel type (optional)</Text>
            <View style={styles.chipRow}>
              {FUEL_TYPE_OPTIONS.map((option) => {
                const selected = fuelType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setFuelType(selected ? null : option.value)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
                <Text style={styles.buttonGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
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
    maxHeight: "85%",
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
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
