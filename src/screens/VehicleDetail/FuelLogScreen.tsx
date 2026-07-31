import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { computeEconomySegments, createFuelLog, deleteFuelLog, listFuelLogs } from "../../repositories/fuelRepository";
import { getVehicle } from "../../repositories/vehicleRepository";
import { showErrorAlert } from "../../utils/errorAlert";
import type { FuelLog } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, spacing, typography } from "../../theme";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance, formatEconomy, formatVolume } from "../../utils/units";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import FAB from "../../components/FAB";
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

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  async function handleAdd(filledAtKm: number, volumeLiters: number, cost: number | null, fullTank: boolean) {
    setModalVisible(false);
    try {
      await createFuelLog({
        vehicle_id: vehicleId, filled_at_km: filledAtKm,
        filled_at_date: new Date().toISOString().slice(0, 10),
        volume_liters: volumeLiters, cost, full_tank: fullTank,
      });
      await reload();
    } catch (err) { showErrorAlert("Couldn't save fill-up", err); }
  }

  function confirmDelete(log: FuelLog) {
    Alert.alert("Delete this fill-up?", formatDate(log.filled_at_date), [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await deleteFuelLog(log.id); await reload(); }
          catch (err) { showErrorAlert("Couldn't delete fill-up", err); }
      } },
    ]);
  }

  const segments = computeEconomySegments(logs);
  const avgEconomy = segments.length > 0
    ? formatEconomy(
        segments.reduce((sum, s) => sum + s.distanceKm, 0),
        segments.reduce((sum, s) => sum + s.volumeLiters, 0),
        unit, volumeUnit
      )
    : null;
  const economyByLogId = new Map(segments.map((s) => [s.toKm, s]));

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(log) => String(log.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          avgEconomy ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Average Fuel Economy</Text>
              <Text style={styles.summaryValue}>{avgEconomy}</Text>
              <Text style={styles.summaryHint}>
                Based on {segments.length} full-tank interval{segments.length === 1 ? "" : "s"}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyHint}>
              Log at least two full-tank fill-ups to see your fuel economy.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const segment = economyByLogId.get(item.filled_at_km);
          return (
            <Pressable onPress={() => confirmDelete(item)}>
              {({ pressed }) => (
                <Card style={[styles.rowCard, pressed && styles.rowCardPressed]}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle}>{formatDistance(item.filled_at_km, unit)}</Text>
                    {!item.full_tank && (
                      <StatusBadge label="Partial" bg={colors.warningSoft} fg={colors.warning} />
                    )}
                  </View>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(item.filled_at_date)} • {formatVolume(item.volume_liters, volumeUnit)}
                    {item.cost != null ? ` • $${item.cost.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : ""}
                  </Text>
                  {segment && (
                    <Text style={styles.rowEconomy}>
                      {formatEconomy(segment.distanceKm, segment.volumeLiters, unit, volumeUnit)}
                    </Text>
                  )}
                </Card>
              )}
            </Pressable>
          );
        }}
      />

      <FAB
        icon={<Ionicons name="add" size={28} color={colors.onPrimary} />}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add fuel fill-up"
      />

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
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLabel: { ...typography.label, color: colors.primary },
  summaryValue: { ...typography.title, color: colors.primary, marginTop: spacing.xs },
  summaryHint: { ...typography.caption, marginTop: spacing.xs },
  emptyHint: { ...typography.caption, marginBottom: spacing.md },
  rowCard: { marginBottom: spacing.sm },
  rowCardPressed: { backgroundColor: colors.primarySoft },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowTitle: { ...typography.body, fontWeight: "700" },
  rowSubtitle: { ...typography.caption, marginTop: spacing.xs },
  rowEconomy: { ...typography.smallBold, color: colors.primary, marginTop: spacing.xs },
});
