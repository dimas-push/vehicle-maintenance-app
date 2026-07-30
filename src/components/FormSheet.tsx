import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import PrimaryButton from "./PrimaryButton";

interface FormSheetProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
}

/** Backdrop + bottom sheet + title + Cancel/Submit — the modal-form shell reimplemented in every Add/Edit modal before this rebuild. */
export default function FormSheet({
  visible,
  title,
  children,
  onCancel,
  onSubmit,
  submitLabel = "Save",
  submitDisabled = false,
  submitLoading = false,
}: FormSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.body}>
            {children}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <View style={styles.submitButton}>
              <PrimaryButton label={submitLabel} onPress={onSubmit} disabled={submitDisabled} loading={submitLoading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  title: { ...typography.title, marginBottom: spacing.md },
  body: { flexGrow: 0 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelLabel: { ...typography.body, fontWeight: "700", color: colors.textMuted },
  submitButton: { minWidth: 120 },
});
