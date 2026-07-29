import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { type DistanceUnit, displayToKm, kmToDisplay } from "../utils/units";
import { getReminderThresholds, setReminderThresholds } from "../utils/reminderSettings";
import { listVehicles } from "../repositories/vehicleRepository";
import { recalculateSchedules } from "../repositories/scheduleRepository";
import { notifyDueSchedules } from "../services/notifications";
import { colors, radius, shadow, spacing, typography } from "../theme";

const OPTIONS: { value: DistanceUnit; label: string; hint: string }[] = [
  { value: "km", label: "Kilometers", hint: "Used in most of the world" },
  { value: "mi", label: "Miles", hint: "Used in the US and UK" },
];

export default function SettingsScreen() {
  const { unit, setUnit } = useUnitPreference();
  const [kmInput, setKmInput] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getReminderThresholds().then(({ kmThreshold, daysThreshold }) => {
      setKmInput(String(Math.round(kmToDisplay(kmThreshold, unit))));
      setDaysInput(String(daysThreshold));
    });
  }, [unit]);

  async function handleSaveThresholds() {
    const kmValue = Number(kmInput);
    const daysValue = Number(daysInput);
    if (!Number.isFinite(kmValue) || kmValue <= 0 || !Number.isFinite(daysValue) || daysValue <= 0) {
      Alert.alert("Invalid values", "Please enter positive numbers for both fields");
      return;
    }

    setSaving(true);
    try {
      await setReminderThresholds({
        kmThreshold: Math.round(displayToKm(kmValue, unit)),
        daysThreshold: Math.round(daysValue),
      });

      const vehicles = await listVehicles();
      for (const vehicle of vehicles) {
        await recalculateSchedules(vehicle.id);
        await notifyDueSchedules(vehicle.id);
      }

      Alert.alert("Saved", "Reminder thresholds updated for all vehicles.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Distance Unit</Text>
      {OPTIONS.map((option) => {
        const selected = option.value === unit;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setUnit(option.value)}
          >
            <View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionHint}>{option.hint}</Text>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </Pressable>
        );
      })}

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Reminder Sensitivity</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>
          Flag a task as "Due Soon" once it gets this close to its next service.
        </Text>

        <Text style={styles.label}>Within ({unit})</Text>
        <TextInput
          style={styles.input}
          value={kmInput}
          onChangeText={setKmInput}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Within (days)</Text>
        <TextInput
          style={styles.input}
          value={daysInput}
          onChangeText={setDaysInput}
          keyboardType="numeric"
        />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveThresholds}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  sectionSpacing: { marginTop: spacing.lg },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  optionSelected: { borderColor: colors.primary },
  optionLabel: { ...typography.body, fontWeight: "700" },
  optionHint: { ...typography.caption, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardHint: { ...typography.caption, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    alignItems: "center",
    marginTop: spacing.md,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "700" },
});
