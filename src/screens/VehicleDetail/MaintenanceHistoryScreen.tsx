import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { listMaintenanceRecords } from "../../repositories/scheduleRepository";
import type { MaintenanceRecord } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, spacing, typography } from "../../theme";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance } from "../../utils/units";
import { showErrorAlert } from "../../utils/errorAlert";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "MaintenanceHistory">;
type RecordRow = MaintenanceRecord & { item_name: string; shop_name: string | null };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function MaintenanceHistoryScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [records, setRecords] = useState<RecordRow[]>([]);
  const { unit } = useUnitPreference();

  useFocusEffect(
    useCallback(() => {
      listMaintenanceRecords(vehicleId)
        .then(setRecords)
        .catch((err) => showErrorAlert("Couldn't load service history", err));
    }, [vehicleId])
  );

  if (records.length === 0) {
    return (
      <View style={styles.empty}>
        <EmptyState
          icon={<Ionicons name="time-outline" size={36} color={colors.primary} />}
          title="No service history yet"
          caption="Completed maintenance will show up here once you mark items as done."
        />
      </View>
    );
  }

  const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const hasCosts = records.some((r) => r.cost != null);

  return (
    <FlatList
      data={records}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        hasCosts ? (
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total spent</Text>
            <Text style={styles.totalValue}>
              {totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Card>
        ) : null
      }
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.icon} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.item_name}</Text>
              <Text style={styles.cardSub}>
                {formatDate(item.done_at_date)} • {formatDistance(item.done_at_km, unit)}
                {item.cost != null
                  ? ` • ${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ""}
                {item.shop_name ? ` • ${item.shop_name}` : ""}
              </Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row" },
  icon: { marginRight: spacing.sm, marginTop: spacing.xs },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: spacing.xs },
  notes: { ...typography.caption, marginTop: spacing.xs, fontStyle: "italic" },
  totalCard: { backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  totalLabel: { ...typography.caption, color: colors.primaryDark },
  totalValue: { ...typography.title, color: colors.primaryDark, marginTop: spacing.xs },
});
