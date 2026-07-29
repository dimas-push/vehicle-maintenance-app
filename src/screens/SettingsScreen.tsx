import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { useAuth } from "../context/AuthContext";
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
import { backupToCloud, restoreFromCloud } from "../services/cloudBackup";
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
  const { user, isGuest, signOut, returnToLogin } = useAuth();
  const [kmInput, setKmInput] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cloudBackingUp, setCloudBackingUp] = useState(false);
  const [cloudRestoring, setCloudRestoring] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState | null>(null);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getOwnerProfile().then(setProfile);
    }, [])
  );

  function handleSignOut() {
    Alert.alert("Log out?", "Your vehicle data stays on this device either way.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            showErrorAlert("Couldn't log out", err);
          }
        },
      },
    ]);
  }

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
    getReminderThresholds().then(({ kmThreshold, daysThreshold }) => {
      setKmInput(String(Math.round(kmToDisplay(kmThreshold, unit))));
      setDaysInput(String(daysThreshold));
    });
  }, [unit]);

  useFocusEffect(
    useCallback(() => {
      // Re-check on every focus — the user may have just come back from the
      // system Settings app after changing the permission there.
      if (Platform.OS !== "web") getNotificationPermissionState().then(setNotifPermission);
    }, [])
  );

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        "Notifications are off",
        "You can enable them from your device settings.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
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
          ? `\n\nSkipped (unknown vehicle type): ${summary.vehiclesSkipped.join(", ")}`
          : "";
      Alert.alert("Restore complete", `Imported ${summary.vehiclesImported} vehicle(s).${skippedNote}`);
    } catch (err) {
      showErrorAlert("Restore failed", err);
    } finally {
      setImporting(false);
    }
  }

  async function handleCloudBackup() {
    if (!user) return;
    setCloudBackingUp(true);
    try {
      await backupToCloud(user.uid);
      Alert.alert("Backed up", "Your data has been backed up to the cloud.");
    } catch (err) {
      showErrorAlert("Cloud backup failed", err);
    } finally {
      setCloudBackingUp(false);
    }
  }

  async function handleCloudRestore() {
    if (!user) return;
    setCloudRestoring(true);
    try {
      const summary = await restoreFromCloud(user.uid);
      if (!summary) {
        Alert.alert("No cloud backup found", "This account hasn't backed up to the cloud yet.");
        return;
      }
      const skippedNote =
        summary.vehiclesSkipped.length > 0
          ? `\n\nSkipped (unknown vehicle type): ${summary.vehiclesSkipped.join(", ")}`
          : "";
      Alert.alert("Restore complete", `Imported ${summary.vehiclesImported} vehicle(s).${skippedNote}`);
    } catch (err) {
      showErrorAlert("Cloud restore failed", err);
    } finally {
      setCloudRestoring(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {profile && (
        <Pressable style={styles.profileCard} onPress={() => setProfileModalVisible(true)}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          )}
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileName}>{profile.name || "Add your profile"}</Text>
            <Text style={styles.profileHint}>
              {isOwnerProfileEmpty(profile)
                ? "Name, photo, contact info"
                : [profile.phone, profile.email].filter(Boolean).join(" • ") || "Tap to edit"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </Pressable>
      )}

      {(user || isGuest) && (
        <>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              {user ? `Signed in as ${user.email}` : "Not signed in — vehicle data still stays on this device."}
            </Text>
            <Pressable
              style={styles.outlineButton}
              onPress={user ? handleSignOut : returnToLogin}
            >
              <Ionicons
                name={user ? "log-out-outline" : "log-in-outline"}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.outlineButtonText}>{user ? "Log Out" : "Log In"}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Distance Unit</Text>
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

      {notifPermission && (
        <>
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Notifications</Text>
          <View style={styles.card}>
            {notifPermission.granted ? (
              <View style={styles.notifRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.notifStatusText}>Enabled — you'll get reminders when service is due.</Text>
              </View>
            ) : (
              <>
                <View style={styles.notifRow}>
                  <Ionicons name="notifications-off-outline" size={20} color={colors.warning} />
                  <Text style={styles.notifStatusText}>
                    Off — reminders won't show up until you turn notifications on.
                  </Text>
                </View>
                <Pressable style={styles.outlineButton} onPress={handleEnableNotifications}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                  <Text style={styles.outlineButtonText}>Enable Notifications</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}

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
          {user
            ? "Export a backup file, or back it up to the cloud tied to your account."
            : "Your data lives only on this device. Export a backup file regularly, or before uninstalling or switching phones."}
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
          <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineButtonText}>
            {importing ? "Restoring..." : "Restore from File"}
          </Text>
        </Pressable>

        {user && (
          <>
            <Pressable
              style={[styles.outlineButton, styles.outlineButtonSpacing, cloudBackingUp && styles.saveButtonDisabled]}
              onPress={handleCloudBackup}
              disabled={cloudBackingUp}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineButtonText}>
                {cloudBackingUp ? "Backing up..." : "Back Up to Cloud"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.outlineButton, styles.outlineButtonSpacing, cloudRestoring && styles.saveButtonDisabled]}
              onPress={handleCloudRestore}
              disabled={cloudRestoring}
            >
              <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineButtonText}>
                {cloudRestoring ? "Restoring..." : "Restore from Cloud"}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Service Shops</Text>
      <Pressable style={styles.option} onPress={() => navigation.navigate("ShopList")}>
        <View>
          <Text style={styles.optionLabel}>Manage Service Shops</Text>
          <Text style={styles.optionHint}>Saved mechanics and shops for service records</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </Pressable>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  sectionSpacing: { marginTop: spacing.lg },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  profileAvatar: { width: 48, height: 48, borderRadius: radius.pill, marginRight: spacing.sm },
  profileAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  profileTextWrap: { flex: 1 },
  profileName: { ...typography.body, fontWeight: "700" },
  profileHint: { ...typography.caption, marginTop: 2 },
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
  notifRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  notifStatusText: { ...typography.body, flex: 1 },
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
