import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pickVehiclePhotoFromLibrary, takeVehiclePhoto } from "../services/photos";
import { showErrorAlert } from "../utils/errorAlert";
import { colors, radius, spacing, typography } from "../theme";

interface PhotoPickerButtonProps {
  photoUri: string | null;
  label?: string;
  onChange: (uri: string | null) => void;
}

/** Tap to take/choose a photo (with a "Remove Photo" option once one is set) — used by every Add/Edit form with an optional photo field. */
export default function PhotoPickerButton({ photoUri, label = "Add Photo (optional)", onChange }: PhotoPickerButtonProps) {
  function handlePress() {
    Alert.alert("Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const uri = await takeVehiclePhoto();
            if (uri) onChange(uri);
          } catch (err) {
            showErrorAlert("Couldn't open camera", err);
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try {
            const uri = await pickVehiclePhotoFromLibrary();
            if (uri) onChange(uri);
          } catch (err) {
            showErrorAlert("Couldn't open photo library", err);
          }
        },
      },
      ...(photoUri
        ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => onChange(null) }]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  return (
    <Pressable style={styles.picker} onPress={handlePress} accessibilityRole="button" accessibilityLabel={label}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={22} color={colors.primary} />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  picker: { marginBottom: spacing.sm },
  preview: { width: "100%", height: 120, borderRadius: radius.md },
  placeholder: {
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
});
