import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createVehicle } from "../../repositories/vehicleRepository";
import { findOrCreateBrand, findOrCreateVehicleType } from "../../repositories/catalogRepository";
import { recalculateSchedules } from "../../repositories/scheduleRepository";
import { notifyDueSchedules } from "../../services/notifications";
import { showErrorAlert } from "../../utils/errorAlert";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { displayToKm } from "../../utils/units";
import { vehicleClassIcon } from "../../utils/vehicleIcon";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import Card from "../../components/Card";
import FormField from "../../components/FormField";
import PhotoPickerButton from "../../components/PhotoPickerButton";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "Details">;

export default function Step3Details({ route, navigation }: Props) {
  const { vehicleClass, brandName, vehicleTypeId, vehicleTypeName } = route.params;
  const [nickname, setNickname] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { unit } = useUnitPreference();

  async function handleSave() {
    const entered = Number(currentKm);
    if (!nickname.trim()) {
      Alert.alert("Vehicle name is required", 'Example: "Dad\'s Bike" or "Blue Vario"');
      return;
    }
    if (!Number.isFinite(entered) || entered < 0) {
      Alert.alert("Invalid odometer reading", "Please enter a valid number of " + unit);
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
      showErrorAlert("Couldn't save vehicle", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <WizardProgress step={4} total={4} label="Vehicle Details" />

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name={vehicleClassIcon(vehicleClass)} size={28} color={colors.primary} />
            <Text style={styles.summaryText}>
              {brandName} {vehicleTypeName}
            </Text>
          </View>
        </Card>

        <PhotoPickerButton photoUri={photoUri} onChange={setPhotoUri} />

        <FormField label="Vehicle name" value={nickname} onChangeText={setNickname} placeholder="e.g. Blue Vario" />
        <FormField
          label="License plate"
          value={plateNumber}
          onChangeText={setPlateNumber}
          placeholder="Optional"
        />
        <FormField
          label={`Current odometer (${unit})`}
          value={currentKm}
          onChangeText={setCurrentKm}
          placeholder="0"
          numeric
        />

        <View style={styles.saveButton}>
          <PrimaryButton label="Save Vehicle" onPress={handleSave} loading={saving} disabled={saving} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  summaryCard: { marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  summaryText: { ...typography.body, fontWeight: "700" },
  saveButton: { marginTop: spacing.sm },
});
