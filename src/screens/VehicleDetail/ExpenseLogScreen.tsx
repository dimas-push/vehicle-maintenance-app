import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { createExpense, deleteExpense, listExpensesForVehicle } from "../../repositories/expenseRepository";
import type { MiscExpense } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, spacing, typography } from "../../theme";
import { EXPENSE_CATEGORY_LABEL } from "../../utils/expenseCategory";
import { showErrorAlert } from "../../utils/errorAlert";
import { deleteVehiclePhoto } from "../../services/photos";
import Card from "../../components/Card";
import FAB from "../../components/FAB";
import AddExpenseModal from "./AddExpenseModal";

type Props = NativeStackScreenProps<RootStackParamList, "ExpenseLog">;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ExpenseLogScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const reload = useCallback(() => {
    listExpensesForVehicle(vehicleId).then(setExpenses).catch((err) => showErrorAlert("Couldn't load expenses", err));
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function handleAdd(category: MiscExpense["category"], amount: number, expenseDate: string, notes: string | null, photoUri: string | null) {
    setModalVisible(false);
    try {
      await createExpense({ vehicle_id: vehicleId, category, amount, expense_date: expenseDate, notes, photo_uri: photoUri });
      reload();
    } catch (err) { showErrorAlert("Couldn't add expense", err); }
  }

  function confirmDelete(expense: MiscExpense) {
    Alert.alert("Delete this expense?", EXPENSE_CATEGORY_LABEL[expense.category] + " - " + formatDate(expense.expense_date), [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await deleteExpense(expense.id); deleteVehiclePhoto(expense.photo_uri); reload(); }
          catch (err) { showErrorAlert("Couldn't delete expense", err); }
      } },
    ]);
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          expenses.length > 0 ? (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Other Expenses</Text>
              <Text style={styles.summaryValue}>{formatAmount(total)}</Text>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyHint}>
              Track parking, tolls, car washes, fines, accessories, and other one-off costs for this vehicle here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => confirmDelete(item)}
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{EXPENSE_CATEGORY_LABEL[item.category]}</Text>
                <Text style={styles.rowSubtitle}>{formatDate(item.expense_date)}</Text>
                {item.notes ? <Text style={styles.rowNotes}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
            </Pressable>
          </Card>
        )}
      />

      <FAB
        icon={<Ionicons name="add" size={28} color={colors.onPrimary} />}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add expense"
      />

      <AddExpenseModal visible={modalVisible} onCancel={() => setModalVisible(false)} onSubmit={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryCard: { backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  summaryLabel: { ...typography.label, color: colors.primaryDark },
  summaryValue: { ...typography.title, color: colors.primaryDark, marginTop: spacing.xs },
  emptyWrap: { alignItems: "center", marginTop: spacing.xl },
  emptyHint: { ...typography.caption, textAlign: "center" },
  rowCard: { marginBottom: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  rowPressed: { opacity: 0.6 },
  rowBody: { flex: 1, marginRight: spacing.sm },
  rowTitle: { ...typography.body, fontWeight: "700" },
  rowSubtitle: { ...typography.caption, marginTop: spacing.xs },
  rowNotes: { ...typography.caption, fontStyle: "italic", marginTop: spacing.xs },
  rowAmount: { ...typography.body, fontWeight: "700", color: colors.primary },
});
