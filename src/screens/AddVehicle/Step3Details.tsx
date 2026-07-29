import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createVehicle } from "../../repositories/vehicleRepository";
import { findOrCreateBrand, findOrCreateVehicleType } from "../../repositories/catalogRepository";
import { recalculateSchedules } from "../../repositories/scheduleRepository";
import { notifyDueSchedules } from "../../services/notifications";
import { pickVehiclePhotoFromLibrary, takeVehiclePhoto } from "../../services/photos";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { displayToKm } from "../../utils/units";
import { vehicleClassIcon } from "../../utils/vehicleIcon";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "Details">;

export default function Step3Details({ route, navigation }: Props) {
  const { vehicleClass, brandName, vehicleTypeId, vehicleTypeName } = route.params;
  const [nickname, setNickname] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { unit } = useUnitPreference();

  function handlePickPhoto() {
    Alert.alert("Vehicle Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const uri = await takeVehiclePhoto();
            if (uri) setPhotoUri(uri);
          } catch (err) {
            Alert.alert("Couldn't open camera", String(err instanceof Error ? err.message : err));
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try {
            const uri = await pickVehiclePhotoFromLibrary();
            if (uri) setPhotoUri(uri);
          } catch (err) {
            Alert.alert("Couldn't open photo library", String(err instanceof Error ? err.message : err));
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function handleSave() {
    const entered = Number(currentKm);
    if (!nickname.trim()) {
      Alert.alert("Vehicle name is required", "Example: \"Dad's Bike\" or \"Blue Vario\"");
      return;
    }
    if (!Number.isFinite(entered) || entered < 0) {
      Alert.alert("Invalid odometer reading", `Please enter a valid number of ${unit}`);
      return;
    }

    setSaving(true);
    try {
      let resolvedTypeId = vehicleTypeId;
      if (!resolvedTypeId) {
        const brand = await findOrCreateBrand(brandName);
        const vehicleType = await findOrCreateVehicleType(brand.id, vehicleTypeName, vehicleClass);
        resolvedTypeId = vehicleType.id;
      }

      const vehicle = await createVehicle({
        vehicle_type_id: resolvedTypeId,
        nickname: nickname.trim(),
        plate_number: plateNumber.trim() || null,
        current_km: Math.round(displayToKm(entered, unit)),
        photo_uri: photoUri,
      });
      await recalculateSchedules(vehicle.id);
      await notifyDueSchedules(vehicle.id);
      navigation.getParent()?.goBack();
    } catch (err) {
      Alert.alert("Failed to save", String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <WizardProgress step={4} total={4} label="Vehicle Details" />

      <View style={styles.summary}>
        <View style={styles.summaryIconWrap}>
          <MaterialCommunityIcons name={vehicleClassIcon(vehicleClass)} size={20} color={colors.primary} />
        </View>
        <Text style={styles.summaryText}>
          {brandName} {vehicleTypeName}
        </Text>
      </View>

      <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={26} color={colors.primary} />
            <Text style={styles.photoPlaceholderText}>Add Photo (optional)</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Vehicle name</Text>
      <TextInput
        style={styles.input}
        placeholder="Dad's Bike"
        placeholderTextColor={colors.textSubtle}
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>License plate (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="ABC-1234"
        placeholderTextColor={colors.textSubtle}
        value={plateNumber}
        onChangeText={setPlateNumber}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Current odometer ({unit})</Text>
      <TextInput
        style={styles.input}
        placeholder={unit === "mi" ? "7500" : "12000"}
        placeholderTextColor={colors.textSubtle}
        value={currentKm}
        onChangeText={setCurrentKm}
        keyboardType="numeric"
      />

      <Pressable
        style={({ pressed }) => [styles.button, (pressed || saving) && styles.buttonPressed]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Vehicle"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  summaryText: { ...typography.body, fontWeight: "600", color: colors.primaryDark },
  photoPicker: { marginBottom: spacing.lg },
  photoPreview: { width: "100%", height: 160, borderRadius: radius.md },
  photoPlaceholder: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoPlaceholderText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 15,
    color: colors.text,
    ...shadow.card,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md - 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonPressed: { backgroundColor: colors.primaryDark, opacity: 0.9 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
