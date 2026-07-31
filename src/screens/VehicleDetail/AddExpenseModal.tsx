import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { ExpenseCategory } from "../../types/models";
import { EXPENSE_CATEGORY_LABEL } from "../../utils/expenseCategory";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";
import { Chip, ChipGroup } from "../../components/Chip";
import PhotoPickerButton from "../../components/PhotoPickerButton";
import { spacing } from "../../theme";

const CATEGORIES: ExpenseCategory[] = ["parking", "toll", "car_wash", "fine", "accessory", "other"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpenseModal({ visible, onCancel, onSubmit }: {
  visible: boolean; onCancel: () => void;
  onSubmit: (category: ExpenseCategory, amount: number, expenseDate: string, notes: string | null, photoUri: string | null) => void;
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
    <FormSheet visible={visible} title="Add Expense" onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Add">
      <View style={styles.categoryGroup}>
        <ChipGroup>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={EXPENSE_CATEGORY_LABEL[cat]}
              selected={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </ChipGroup>
      </View>
      <FormField label="Amount" value={amount} onChangeText={setAmount} numeric allowDecimal />
      <FormField label="Date" value={expenseDate} onChangeText={setExpenseDate} placeholder="2026-07-30" />
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" />
      <PhotoPickerButton photoUri={photoUri} label="Add Receipt Photo" onChange={setPhotoUri} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  categoryGroup: { marginBottom: spacing.md },
});
