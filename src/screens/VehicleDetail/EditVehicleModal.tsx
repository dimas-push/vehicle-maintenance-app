import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";

export default function EditVehicleModal({
  visible,
  nickname: initialNickname,
  plateNumber: initialPlateNumber,
  vin: initialVin,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  nickname: string;
  plateNumber: string | null;
  vin: string | null;
  onCancel: () => void;
  onSubmit: (nickname: string, plateNumber: string | null, vin: string | null) => void;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [plateNumber, setPlateNumber] = useState(initialPlateNumber ?? "");
  const [vin, setVin] = useState(initialVin ?? "");

  function handleSubmit() {
    if (!nickname.trim()) {
      Alert.alert("Vehicle name is required", "Please enter a name for this vehicle");
      return;
    }
    onSubmit(nickname.trim(), plateNumber.trim() || null, vin.trim() || null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
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
