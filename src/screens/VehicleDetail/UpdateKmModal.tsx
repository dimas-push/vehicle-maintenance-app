import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { typography, spacing } from "../../theme";
import { type DistanceUnit, displayToKm, formatDistance, kmToDisplay } from "../../utils/units";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";
import PhotoPickerButton from "../../components/PhotoPickerButton";

export default function UpdateKmModal({ visible, currentKm, unit, onCancel, onSubmit }: {
  visible: boolean; currentKm: number; unit: DistanceUnit; onCancel: () => void;
  onSubmit: (newKm: number, photoUri: string | null) => void;
}) {
  const currentDisplay = Math.round(kmToDisplay(currentKm, unit));
  const [value, setValue] = useState(String(currentDisplay));
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  function handleSubmit() {
    const entered = Number(value);
    if (!Number.isFinite(entered) || entered < currentDisplay) {
      Alert.alert(
        "Invalid odometer reading",
        "The new reading must be a number and cannot be lower than " + formatDistance(currentKm, unit)
      );
      return;
    }
    onSubmit(Math.round(displayToKm(entered, unit)), photoUri);
    setPhotoUri(null);
  }

  return (
    <FormSheet
      visible={visible}
      title="Update Current Odometer"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save"
    >
      <Text style={styles.subtitle}>{"Last reading: " + formatDistance(currentKm, unit)}</Text>
      <FormField label={`Current Odometer (${unit})`} value={value} onChangeText={setValue} numeric />
      <PhotoPickerButton photoUri={photoUri} label="Add Odometer Photo (optional)" onChange={setPhotoUri} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...typography.subtitle, marginBottom: spacing.md },
});
