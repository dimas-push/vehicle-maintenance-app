import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { getOwnerProfile, isOwnerProfileEmpty, setOwnerProfile, type OwnerProfile } from "../utils/ownerProfile";
import EditProfileModal from "./EditProfileModal";
import { type DistanceUnit, type VolumeUnit, displayToKm, kmToDisplay } from "../utils/units";
import { getReminderThresholds, setReminderThresholds } from "../utils/reminderSettings";
import { listVehicles } from "../repositories/vehicleRepository";
import { recalculateSchedules } from "../repositories/scheduleRepository";
import {
  getNotificationPermissionState,
  notifyDueSchedules,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "../services/notifications";
import { exportBackup, importBackup } from "../services/backup";
import { showErrorAlert } from "../utils/errorAlert";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { VehicleTabsParamList } from "../navigation/VehicleTabs";
import { colors, radius, spacing, typography } from "../theme";
import Card from "../components/Card";
import ListRow from "../components/ListRow";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";

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
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState | null>(null);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getOwnerProfile().then(setProfile).catch((err) => showErrorAlert("Couldn't load profile", err));
    }, [])
  );

  async function handleSaveProfile(next: OwnerProfile) {
    setProfileModalVisible(false);
    try {
      await setOwnerProfile(next);
      setProfile(next);
    } catch (err) {
      showErrorAlert("Couldn't save profile", err);
    }
  }

  useEffect(() => {
    getReminderThresholds()
      .then(({ kmThreshold, daysThreshold }) => {
        setKmInput(String(Math.round(kmToDisplay(kmThreshold, unit))));
        setDaysInput(String(daysThreshold));
      })
      .catch((err) => showErrorAlert("Couldn't load reminder settings", err));
  }, [unit]);

  useFocusEffect(
    useCallback(() => {
      // Re-check on every focus - the user may have just come back from the
      // system Settings app after changing the permission there.
      if (Platform.OS !== "web") {
        getNotificationPermissionState()
          .then(setNotifPermission)
          .catch((err) => showErrorAlert("Couldn't check notification permission", err));
      }
    }, [])
  );

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (!result.granted && !result.canAskAgain) {
      Alert.alert("Notifications are off", "You can enable them from your device settings.", [
        { text: "Not Now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
    }
  }

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
          ? "\n\nSkipped (unknown vehicle type): " + summary.vehiclesSkipped.join(", ")
          : "";
      Alert.alert("Restore complete", "Imported " + summary.vehiclesImported + " vehicle(s)." + skippedNote);
    } catch (err) {
      showErrorAlert("Restore failed", err);
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {profile && (
        <Card style={styles.section}>
          <ListRow
            leading={
              profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.photo} />
              ) : (
                <Ionicons name="person" size={22} color={colors.primary} />
              )
            }
            title={profile.name || "Add your profile"}
            subtitle={
              isOwnerProfileEmpty(profile)
                ? "Add your name and photo to personalize the app"
                : "Tap to edit your profile"
            }
            onPress={() => setProfileModalVisible(true)}
          />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Distance Unit</Text>
      {OPTIONS.map((option) => {
        const selected = option.value === unit;
        return (
          <Card key={option.value} style={[styles.optionCard, selected && styles.optionCardSelected]}>
            <ListRow
              title={option.label}
              subtitle={option.hint}
              trailing={
                selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : undefined
              }
              onPress={() => setUnit(option.value)}
              showChevron={false}
            />
          </Card>
        );
      })}

      <Text style={styles.sectionTitle}>Fuel Volume Unit</Text>
      {VOLUME_OPTIONS.map((option) => {
        const selected = option.value === volumeUnit;
        return (
          <Card key={option.value} style={[styles.optionCard, selected && styles.optionCardSelected]}>
            <ListRow
              title={option.label}
              subtitle={option.hint}
              trailing={
                selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : undefined
              }
              onPress={() => setVolumeUnit(option.value)}
              showChevron={false}
            />
          </Card>
        );
      })}

      {notifPermission && (
        <>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.section}>
            {notifPermission.granted ? (
              <View style={styles.notifRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.notifText}>Enabled — you&apos;ll get reminders when service is due.</Text>
              </View>
            ) : (
              <>
                <View style={styles.notifRow}>
                  <Ionicons name="notifications-off" size={22} color={colors.warning} />
                  <Text style={styles.notifText}>
                    Off — reminders won&apos;t show up until you turn notifications on.
                  </Text>
                </View>
                <OutlineButton
                  icon="notifications-outline"
                  label="Enable Notifications"
                  onPress={handleEnableNotifications}
                />
              </>
            )}
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>Reminder Sensitivity</Text>
      <Card style={styles.section}>
        <Text style={styles.hint}>Flag a task as &quot;Due Soon&quot; once it gets this close to its next service.</Text>
        <FormField
          label={`Within (${unit})`}
          value={kmInput}
          onChangeText={setKmInput}
          placeholder="e.g. 500"
          numeric
        />
        <FormField label="Within (days)" value={daysInput} onChangeText={setDaysInput} placeholder="e.g. 14" numeric />
        <PrimaryButton label={saving ? "Saving..." : "Save"} onPress={handleSaveThresholds} disabled={saving} />
      </Card>

      <Text style={styles.sectionTitle}>Backup & Restore</Text>
      <Card style={styles.section}>
        <Text style={styles.hint}>
          Your data lives only on this device. Export a backup file regularly, or before uninstalling or switching
          phones.
        </Text>
        <OutlineButton icon="download-outline" label="Export Backup" onPress={handleExport} loading={exporting} />
        <View style={styles.buttonSpacing}>
          <OutlineButton
            icon="folder-open-outline"
            label="Restore from File"
            onPress={handleImport}
            loading={importing}
          />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Service Shops</Text>
      <Card style={styles.section}>
        <ListRow
          title="Manage Service Shops"
          subtitle="Saved mechanics and shops for service records"
          onPress={() => navigation.navigate("ShopList")}
        />
      </Card>

      {profile && (
        <EditProfileModal
          visible={profileModalVisible}
          profile={profile}
          onCancel={() => setProfileModalVisible(false)}
          onSubmit={handleSaveProfile}
        />
      )}
    </ScrollView>
  );
}

interface OutlineButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Screen-local bordered/transparent button — the component library (M2,
 * locked) has no "outline button" variant, so this is built here rather
 * than added to src/components/. Mirrors PrimaryButton's loading
 * convention: a spinner replaces the content and the button disables
 * itself while loading is true.
 */
function OutlineButton({ icon, label, onPress, disabled = false, loading = false }: OutlineButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.outlineButton,
        isDisabled && styles.outlineButtonDisabled,
        pressed && !isDisabled && styles.outlineButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons name={icon} size={18} color={colors.primary} />
          <Text style={styles.outlineButtonLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.sm },
  optionCard: { marginBottom: spacing.sm },
  optionCardSelected: { borderWidth: 2, borderColor: colors.primary },
  photo: { width: 44, height: 44 },
  hint: { ...typography.caption, marginBottom: spacing.md },
  notifRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
  notifText: { ...typography.body, flex: 1 },
  buttonSpacing: { marginTop: spacing.sm },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  outlineButtonPressed: { backgroundColor: colors.primarySoft },
  outlineButtonDisabled: { opacity: 0.5 },
  outlineButtonLabel: { ...typography.body, color: colors.primary, fontWeight: "700" },
});
