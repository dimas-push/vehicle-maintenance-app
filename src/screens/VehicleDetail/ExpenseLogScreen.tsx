import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { createExpense, deleteExpense, listExpensesForVehicle } from "../../repositories/expenseRepository";
import type { MiscExpense } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import { EXPENSE_CATEGORY_LABEL } from "../../utils/expenseCategory";
import { showErrorAlert } from "../../utils/errorAlert";
import { deleteVehiclePhoto } from "../../services/photos";
import AddExpenseModal from "./AddExpenseModal";

type Props = NativeStackScreenProps<RootStackParamList, "ExpenseLog">;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpenseLogScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const reload = useCallback(() => {
    listExpensesForVehicle(vehicleId)
      .then(setExpenses)
      .catch((err) => showErrorAlert("Couldn't load expenses", err));
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleAdd(
    category: MiscExpense["category"],
    amount: number,
    expenseDate: string,
    notes: string | null,
    photoUri: string | null
  ) {
    setModalVisible(false);
    try {
      await createExpense({ vehicle_id: vehicleId, category, amount, expense_date: expenseDate, notes, photo_uri: photoUri });
      reload();
    } catch (err) {
      showErrorAlert("Couldn't add expense", err);
    }
  }

  function confirmDelete(expense: MiscExpense) {
    Alert.alert("Delete this expense?", `${EXPENSE_CATEGORY_LABEL[expense.category]} — ${formatDate(expense.expense_date)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(expense.id);
            deleteVehiclePhoto(expense.photo_uri);
            reload();
          } catch (err) {
            showErrorAlert("Couldn't delete expense", err);
          }
        },
      },
    ]);
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          expenses.length > 0 ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Other Expenses</Text>
              <Text style={styles.summaryValue}>
                {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyHint}>
              Log parking, tolls, car washes, fines, or accessories here — costs that aren't a service record or a
              fuel fill-up.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => confirmDelete(item)}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{EXPENSE_CATEGORY_LABEL[item.category]}</Text>
              <Text style={styles.cardSub}>{formatDate(item.expense_date)}</Text>
              {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
            </View>
            <Text style={styles.cardAmount}>
              {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <AddExpenseModal visible={modalVisible} onCancel={() => setModalVisible(false)} onSubmit={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLabel: { ...typography.caption, color: colors.primaryDark },
  summaryValue: { fontSize: 22, fontWeight: "700", color: colors.primaryDark, marginTop: 2 },
  emptyHint: { ...typography.caption, marginBottom: spacing.md, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 2 },
  cardNotes: { ...typography.caption, marginTop: spacing.xs, fontStyle: "italic" },
  cardAmount: { ...typography.body, fontWeight: "700", color: colors.primary },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 10px rgba(37, 99, 235, 0.35)",
    elevation: 4,
  },
});
