import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { VehicleLoan } from "../../types/models";
import { colors, radius, spacing, typography } from "../../theme";

export default function AddLoanModal({
  visible,
  existing,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  existing: VehicleLoan | null;
  onCancel: () => void;
  onSubmit: (lender: string | null, monthlyPayment: number, startDate: string, termMonths: number) => void;
}) {
  const [lender, setLender] = useState(existing?.lender ?? "");
  const [monthlyPayment, setMonthlyPayment] = useState(
    existing ? String(existing.monthly_payment) : ""
  );
  const [startDate, setStartDate] = useState(existing?.start_date ?? "");
  const [termMonths, setTermMonths] = useState(existing ? String(existing.term_months) : "");

  function handleSubmit() {
    const payment = Number(monthlyPayment);
    const term = Number(termMonths);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      Alert.alert("Invalid date", "Enter the loan start date as YYYY-MM-DD, e.g. 2024-06-01");
      return;
    }
    if (!Number.isFinite(payment) || payment <= 0) {
      Alert.alert("Invalid monthly payment", "Please enter a positive number");
      return;
    }
    if (!Number.isFinite(term) || term <= 0) {
      Alert.alert("Invalid loan term", "Please enter the loan term in months (e.g. 48)");
      return;
    }
    onSubmit(lender.trim() || null, payment, startDate.trim(), Math.round(term));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{existing ? "Edit Loan" : "Add Loan"}</Text>

          <Text style={styles.label}>Lender (optional)</Text>
          <TextInput
            style={styles.input}
            value={lender}
            onChangeText={setLender}
            placeholder="e.g. Toyota Financial"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>Monthly payment</Text>
          <TextInput
            style={styles.input}
            value={monthlyPayment}
            onChangeText={setMonthlyPayment}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2024-06-01"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>Loan term (months)</Text>
          <TextInput
            style={styles.input}
            value={termMonths}
            onChangeText={setTermMonths}
            keyboardType="numeric"
            placeholder="48"
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
  title: { ...typography.title, marginBottom: spacing.sm },
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
