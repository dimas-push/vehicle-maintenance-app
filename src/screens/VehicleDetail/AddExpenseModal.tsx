import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ExpenseCategory } from "../../types/models";
import { EXPENSE_CATEGORY_LABEL } from "../../utils/expenseCategory";
import PhotoPickerButton from "../../components/PhotoPickerButton";
import { colors, radius, spacing, typography } from "../../theme";

const CATEGORIES: ExpenseCategory[] = ["parking", "toll", "car_wash", "fine", "accessory", "other"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpenseModal({
  visible,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (
    category: ExpenseCategory,
    amount: number,
    expenseDate: string,
    notes: string | null,
    photoUri: string | null
  ) => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("parking");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  function handleSubmit() {
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert("Invalid amount", "Please enter a positive number");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate.trim())) {
      Alert.alert("Invalid date", "Enter the date as YYYY-MM-DD, e.g. 2026-07-30");
      return;
    }
    onSubmit(category, amountValue, expenseDate.trim(), notes.trim() || null, photoUri);
    setAmount("");
    setExpenseDate(today());
    setNotes("");
    setPhotoUri(null);
    setCategory("parking");
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Add Expense</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const selected = cat === category;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {EXPENSE_CATEGORY_LABEL[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSubtle}
              autoFocus
            />

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={expenseDate}
              onChangeText={setExpenseDate}
              placeholder="2026-07-30"
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. mall parking, downtown toll"
              placeholderTextColor={colors.textSubtle}
            />

            <Text style={styles.label}>Receipt photo (optional)</Text>
            <PhotoPickerButton photoUri={photoUri} label="Add Receipt Photo" onChange={setPhotoUri} />

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
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
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
