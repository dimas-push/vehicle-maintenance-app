import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ServiceShop } from "../../types/models";
import { colors, radius, spacing, typography } from "../../theme";
import PhotoPickerButton from "../../components/PhotoPickerButton";

export default function MarkDoneModal({
  visible,
  itemName,
  odometerLabel,
  shops,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  itemName: string;
  odometerLabel: string;
  shops: ServiceShop[];
  onCancel: () => void;
  onSubmit: (cost: number | null, notes: string | null, photoUri: string | null, shopId: number | null) => void;
}) {
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);

  function handleSubmit() {
    const parsedCost = cost.trim() ? Number(cost) : null;
    onSubmit(
      parsedCost != null && Number.isFinite(parsedCost) ? parsedCost : null,
      notes.trim() || null,
      photoUri,
      shopId
    );
    setCost("");
    setNotes("");
    setPhotoUri(null);
    setShopId(null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Mark as Done</Text>
            <Text style={styles.subtitle}>
              {itemName} — logged today at {odometerLabel}
            </Text>

            <Text style={styles.label}>Cost (optional)</Text>
            <TextInput
              style={styles.input}
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSubtle}
            />

            {shops.length > 0 && (
              <>
                <Text style={styles.label}>Shop (optional)</Text>
                <View style={styles.chipRow}>
                  {shops.map((shop) => {
                    const selected = shopId === shop.id;
                    return (
                      <Pressable
                        key={shop.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setShopId(selected ? null : shop.id)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {shop.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. part brand, what was done"
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Receipt photo (optional)</Text>
            <PhotoPickerButton photoUri={photoUri} label="Add Receipt Photo" onChange={setPhotoUri} />

            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCancel}>
                <Text style={styles.buttonGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Done</Text>
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
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.md },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
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
