import { useState } from "react";
import { Alert } from "react-native";
import FormField from "../../components/FormField";
import FormSheet from "../../components/FormSheet";
import type { VehicleLoan } from "../../types/models";

export default function AddLoanModal({ visible, existing, onCancel, onSubmit }: {
  visible: boolean; existing: VehicleLoan | null; onCancel: () => void;
  onSubmit: (lender: string | null, monthlyPayment: number, startDate: string, termMonths: number) => void;
}) {
  const [lender, setLender] = useState(existing?.lender ?? "");
  const [monthlyPayment, setMonthlyPayment] = useState(existing ? String(existing.monthly_payment) : "");
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
    <FormSheet
      visible={visible}
      title={existing ? "Edit Loan" : "Add Loan"}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save"
    >
      <FormField label="Lender" value={lender} onChangeText={setLender} placeholder="Optional" />
      <FormField
        label="Monthly payment"
        value={monthlyPayment}
        onChangeText={setMonthlyPayment}
        placeholder="0"
        numeric
        allowDecimal
      />
      <FormField
        label="Start date"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2024-06-01"
      />
      <FormField
        label="Loan term (months)"
        value={termMonths}
        onChangeText={setTermMonths}
        placeholder="48"
        numeric
      />
    </FormSheet>
  );
}
