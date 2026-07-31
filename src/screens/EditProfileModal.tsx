import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { OwnerProfile } from "../utils/ownerProfile";
import FormSheet from "../components/FormSheet";
import FormField from "../components/FormField";
import PhotoPickerButton from "../components/PhotoPickerButton";
import { spacing, typography } from "../theme";

export default function EditProfileModal({ visible, profile, onCancel, onSubmit }: {
  visible: boolean; profile: OwnerProfile; onCancel: () => void;
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
    <FormSheet visible={visible} title="My Profile" onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Save">
      <Text style={styles.hint}>
        Shown only on this device — used to personalize the app and label your exported reports.
      </Text>
      <PhotoPickerButton photoUri={photoUri} label="Add Photo (optional)" onChange={setPhotoUri} />
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      <FormField label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" />
      <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Optional" />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.caption, marginBottom: spacing.md },
});
