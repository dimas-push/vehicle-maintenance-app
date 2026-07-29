import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import { type DistanceUnit, displayToKm, formatDistance, kmToDisplay } from "../../utils/units";
import PhotoPickerButton from "../../components/PhotoPickerButton";

export default function UpdateKmModal({
  visible,
  currentKm,
  unit,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  currentKm: number;
  unit: DistanceUnit;
  onCancel: () => void;
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
        `The new reading must be a number and cannot be lower than ${formatDistance(currentKm, unit)}`
      );
      return;
    }
    onSubmit(Math.round(displayToKm(entered, unit)), photoUri);
    setPhotoUri(null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Update Current Odometer</Text>
          <Text style={styles.subtitle}>Last reading: {formatDistance(currentKm, unit)}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
          />
          <View style={styles.photoSpacing}>
            <PhotoPickerButton
              photoUri={photoUri}
              label="Add Odometer Photo (optional)"
              onChange={setPhotoUri}
            />
          </View>
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
              <Text style={styles.buttonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Save</Text>
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
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
  },
  photoSpacing: { marginTop: spacing.sm },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.md, gap: spacing.sm },
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
