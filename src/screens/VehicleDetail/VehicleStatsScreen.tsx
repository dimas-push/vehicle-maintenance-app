import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listMaintenanceRecords } from "../../repositories/scheduleRepository";
import { computeEconomySegments, listFuelLogs } from "../../repositories/fuelRepository";
import { listExpensesForVehicle } from "../../repositories/expenseRepository";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, spacing, typography } from "../../theme";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { aggregateMonthlyCost, type MonthlyCostPoint } from "../../utils/costTrend";
import { economyValue } from "../../utils/units";
import Card from "../../components/Card";
import TrendChart, { type TrendPoint } from "../../components/TrendChart";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleStats">;

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function VehicleStatsScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const { unit, volumeUnit } = useUnitPreference();
  const [costPoints, setCostPoints] = useState<MonthlyCostPoint[]>([]);
  const [economyPoints, setEconomyPoints] = useState<TrendPoint[]>([]);

  const reload = useCallback(async () => {
    const [records, fuelLogs, expenses] = await Promise.all([
      listMaintenanceRecords(vehicleId),
      listFuelLogs(vehicleId),
      listExpensesForVehicle(vehicleId),
    ]);

    setCostPoints(
      aggregateMonthlyCost(
        records.map((r) => ({ date: r.done_at_date, cost: r.cost })),
        fuelLogs.map((f) => ({ date: f.filled_at_date, cost: f.cost })),
        expenses.map((e) => ({ date: e.expense_date, cost: e.amount }))
      )
    );

    setEconomyPoints(
      computeEconomySegments(fuelLogs)
        .map((segment) => {
          const value = economyValue(segment.distanceKm, segment.volumeLiters, unit, volumeUnit);
          return value == null ? null : { label: dateLabel(segment.toDate), value };
        })
        .filter((p): p is TrendPoint => p != null)
    );
  }, [vehicleId, unit, volumeUnit]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const economyLabel = `${unit}/${volumeUnit === "gallons" ? "gal" : "L"}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Cost Over Time</Text>
      <Card style={styles.card}>
        <Text style={styles.cardHint}>Maintenance, fuel, and other expenses combined, by month.</Text>
        <TrendChart
          data={costPoints.map((p) => ({ label: monthLabel(p.month), value: p.total }))}
          formatValue={(v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        />
      </Card>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Fuel Economy Over Time</Text>
      <Card style={styles.card}>
        <Text style={styles.cardHint}>Distance per volume for each full-tank interval.</Text>
        <TrendChart
          data={economyPoints}
          color={colors.success}
          formatValue={(v) => `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${economyLabel}`}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { ...typography.label },
  sectionSpacing: { marginTop: spacing.lg },
  card: { marginTop: spacing.sm },
  cardHint: { ...typography.caption, marginBottom: spacing.sm },
});
