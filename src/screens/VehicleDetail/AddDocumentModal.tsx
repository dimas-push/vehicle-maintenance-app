import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { DocumentType } from "../../types/models";
import { DOCUMENT_TYPE_LABEL } from "../../utils/documentStatus";
import { colors, radius, spacing, typography } from "../../theme";

const TYPES: DocumentType[] = ["tax", "insurance", "registration", "warranty", "other"];

export default function AddDocumentModal({
  visible,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (documentType: DocumentType, label: string, expiryDate: string) => void;
}) {
  const [documentType, setDocumentType] = useState<DocumentType>("tax");
  const [label, setLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  function handleSubmit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim())) {
      Alert.alert("Invalid date", "Enter the expiry date as YYYY-MM-DD, e.g. 2027-03-15");
      return;
    }
    const finalLabel = label.trim() || DOCUMENT_TYPE_LABEL[documentType];
    onSubmit(documentType, finalLabel, expiryDate.trim());
    setLabel("");
    setExpiryDate("");
    setDocumentType("tax");
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Add Document Reminder</Text>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((type) => {
                const selected = type === documentType;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                    onPress={() => setDocumentType(type)}
                  >
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {DOCUMENT_TYPE_LABEL[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Label (optional)</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder={DOCUMENT_TYPE_LABEL[documentType]}
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Expiry date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2027-03-15"
              placeholderTextColor={colors.textSubtle}
            />

            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
                <Text style={styles.buttonGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          </ScrollView>
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
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  typeChipTextSelected: { color: "#fff" },
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
