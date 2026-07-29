import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { OwnerProfile } from "../utils/ownerProfile";
import PhotoPickerButton from "../components/PhotoPickerButton";
import { colors, radius, spacing, typography } from "../theme";

export default function EditProfileModal({
  visible,
  profile,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  profile: OwnerProfile;
  onCancel: () => void;
  onSubmit: (profile: OwnerProfile) => void;
}) {
  const [name, setName] = useState(profile.name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(profile.photoUri);

  function handleSubmit() {
    onSubmit({
      name: name.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      photoUri,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.hint}>
            Shown only on this device — used to personalize the app and label your exported reports.
          </Text>

          <PhotoPickerButton photoUri={photoUri} label="Add Photo (optional)" onChange={setPhotoUri} />

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dimas"
            placeholderTextColor={colors.textSubtle}
            autoFocus
          />

          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.textSubtle}
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
  title: { ...typography.title, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.md },
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
