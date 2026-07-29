import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { type DistanceUnit, type VolumeUnit, displayToKm, kmToDisplay } from "../utils/units";
import { getReminderThresholds, setReminderThresholds } from "../utils/reminderSettings";
import { listVehicles } from "../repositories/vehicleRepository";
import { recalculateSchedules } from "../repositories/scheduleRepository";
import { notifyDueSchedules } from "../services/notifications";
import { exportBackup, importBackup } from "../services/backup";
import { showErrorAlert } from "../utils/errorAlert";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { VehicleTabsParamList } from "../navigation/VehicleTabs";
import { colors, radius, shadow, spacing, typography } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<VehicleTabsParamList, "Settings">,
  NativeStackScreenProps<RootStackParamList>
>;

const OPTIONS: { value: DistanceUnit; label: string; hint: string }[] = [
  { value: "km", label: "Kilometers", hint: "Used in most of the world" },
  { value: "mi", label: "Miles", hint: "Used in the US and UK" },
];

const VOLUME_OPTIONS: { value: VolumeUnit; label: string; hint: string }[] = [
  { value: "liters", label: "Liters", hint: "Used in most of the world" },
  { value: "gallons", label: "Gallons", hint: "US gallons" },
];

export default function SettingsScreen({ navigation }: Props) {
  const { unit, setUnit, volumeUnit, setVolumeUnit } = useUnitPreference();
  const [kmInput, setKmInput] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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
    } catch (err) {
      showErrorAlert("Couldn't save reminder settings", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
    } catch (err) {
      showErrorAlert("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const summary = await importBackup();
      if (!summary) return; // user canceled the picker

      const skippedNote =
        summary.vehiclesSkipped.length > 0
          ? `\n\nSkipped (unknown vehicle type): ${summary.vehiclesSkipped.join(", ")}`
          : "";
      Alert.alert("Restore complete", `Imported ${summary.vehiclesImported} vehicle(s).${skippedNote}`);
    } catch (err) {
      showErrorAlert("Restore failed", err);
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Fuel Volume Unit</Text>
      {VOLUME_OPTIONS.map((option) => {
        const selected = option.value === volumeUnit;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setVolumeUnit(option.value)}
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

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Backup & Restore</Text>
      <View style={styles.card}>
        <Text style={styles.cardHint}>
          Your data lives only on this device. Export a backup file regularly, or before
          uninstalling or switching phones.
        </Text>

        <Pressable
          style={[styles.outlineButton, exporting && styles.saveButtonDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Ionicons name="download-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineButtonText}>
            {exporting ? "Exporting..." : "Export Backup"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.outlineButton, styles.outlineButtonSpacing, importing && styles.saveButtonDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineButtonText}>
            {importing ? "Restoring..." : "Restore from Backup"}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Service Shops</Text>
      <Pressable style={styles.option} onPress={() => navigation.navigate("ShopList")}>
        <View>
          <Text style={styles.optionLabel}>Manage Service Shops</Text>
          <Text style={styles.optionHint}>Saved mechanics and shops for service records</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.md, paddingBottom: spacing.xl },
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
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
  },
  outlineButtonSpacing: { marginTop: spacing.sm },
  outlineButtonText: { color: colors.primary, fontWeight: "700" },
});
