import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { listMaintenanceRecords } from "../../repositories/scheduleRepository";
import type { MaintenanceRecord } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance } from "../../utils/units";

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
      listMaintenanceRecords(vehicleId).then(setRecords);
    }, [vehicleId])
  );

  if (records.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="time-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No service history yet</Text>
        <Text style={styles.emptyText}>
          Completed maintenance will show up here once you mark items as done.
        </Text>
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
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total spent</Text>
            <Text style={styles.totalValue}>{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
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
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.title, marginBottom: spacing.xs },
  emptyText: { ...typography.subtitle, textAlign: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  iconWrap: { marginRight: spacing.sm, marginTop: 2 },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 2 },
  notes: { ...typography.caption, marginTop: spacing.xs, fontStyle: "italic" },
  totalCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  totalLabel: { ...typography.caption, color: colors.primaryDark },
  totalValue: { fontSize: 22, fontWeight: "700", color: colors.primaryDark, marginTop: 2 },
});
