import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  computeEconomySegments,
  createFuelLog,
  deleteFuelLog,
  listFuelLogs,
} from "../../repositories/fuelRepository";
import { getVehicle } from "../../repositories/vehicleRepository";
import { showErrorAlert } from "../../utils/errorAlert";
import type { FuelLog } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance, formatEconomy, formatVolume } from "../../utils/units";
import AddFuelLogModal from "./AddFuelLogModal";

type Props = NativeStackScreenProps<RootStackParamList, "FuelLog">;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function FuelLogScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentKm, setCurrentKm] = useState(0);
  const { unit, volumeUnit } = useUnitPreference();

  const reload = useCallback(async () => {
    const [v, l] = await Promise.all([getVehicle(vehicleId), listFuelLogs(vehicleId)]);
    setCurrentKm(v?.current_km ?? 0);
    setLogs(l);
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleAdd(filledAtKm: number, volumeLiters: number, cost: number | null, fullTank: boolean) {
    setModalVisible(false);
    try {
      await createFuelLog({
        vehicle_id: vehicleId,
        filled_at_km: filledAtKm,
        filled_at_date: new Date().toISOString().slice(0, 10),
        volume_liters: volumeLiters,
        cost,
        full_tank: fullTank,
      });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save fill-up", err);
    }
  }

  function confirmDelete(log: FuelLog) {
    Alert.alert("Delete this fill-up?", formatDate(log.filled_at_date), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFuelLog(log.id);
            await reload();
          } catch (err) {
            showErrorAlert("Couldn't delete fill-up", err);
          }
        },
      },
    ]);
  }

  const segments = computeEconomySegments(logs);
  const avgEconomy =
    segments.length > 0
      ? formatEconomy(
          segments.reduce((sum, s) => sum + s.distanceKm, 0),
          segments.reduce((sum, s) => sum + s.volumeLiters, 0),
          unit,
          volumeUnit
        )
      : null;
  const economyByLogId = new Map(segments.map((s) => [s.toKm, s]));

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          avgEconomy ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Average Fuel Economy</Text>
              <Text style={styles.summaryValue}>{avgEconomy}</Text>
              <Text style={styles.summaryHint}>Based on {segments.length} full-tank interval(s)</Text>
            </View>
          ) : (
            <Text style={styles.emptyHint}>
              Log at least two full-tank fill-ups to see fuel economy.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const segment = economyByLogId.get(item.filled_at_km);
          return (
            <Pressable style={styles.card} onPress={() => confirmDelete(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{formatDistance(item.filled_at_km, unit)}</Text>
                {!item.full_tank && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Partial</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSub}>
                {formatDate(item.filled_at_date)} • {formatVolume(item.volume_liters, volumeUnit)}
                {item.cost != null
                  ? ` • ${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ""}
              </Text>
              {segment && (
                <Text style={styles.economyText}>
                  {formatEconomy(segment.distanceKm, segment.volumeLiters, unit, volumeUnit)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />

      <Pressable
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add fuel fill-up"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <AddFuelLogModal
        visible={modalVisible}
        currentKm={currentKm}
        unit={unit}
        volumeUnit={volumeUnit}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleAdd}
      />
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
  summaryHint: { ...typography.caption, color: colors.primaryDark, marginTop: 4 },
  emptyHint: { ...typography.caption, marginBottom: spacing.md, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 4 },
  economyText: { ...typography.caption, color: colors.primary, fontWeight: "700", marginTop: 4 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.warningSoft },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.warning },
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
