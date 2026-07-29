import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getVehicle, updateCurrentKm } from "../../repositories/vehicleRepository";
import {
  listSchedulesForVehicle,
  recalculateSchedules,
  recordMaintenanceDone,
} from "../../repositories/scheduleRepository";
import type { MaintenanceSchedule, Vehicle } from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import { STATUS_LABEL, STATUS_STYLE } from "../../utils/scheduleStatusPresentation";
import { notifyDueSchedules } from "../../services/notifications";
import UpdateKmModal from "./UpdateKmModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;
type ScheduleRow = MaintenanceSchedule & { item_name: string };

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function VehicleDetailScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [kmModalVisible, setKmModalVisible] = useState(false);

  const reload = useCallback(async () => {
    const [v, s] = await Promise.all([getVehicle(vehicleId), listSchedulesForVehicle(vehicleId)]);
    setVehicle(v);
    setSchedules(s.sort((a, b) => b.status.localeCompare(a.status)));
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleUpdateKm(newKm: number) {
    setKmModalVisible(false);
    await updateCurrentKm(vehicleId, newKm);
    await recalculateSchedules(vehicleId);
    await notifyDueSchedules(vehicleId);
    await reload();
  }

  function confirmMarkDone(item: ScheduleRow) {
    if (!vehicle) return;
    Alert.alert(
      "Mark as done?",
      `${item.item_name} will be logged as done today at ${vehicle.current_km.toLocaleString("en-US")} km.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, done",
          onPress: async () => {
            await recordMaintenanceDone(
              vehicleId,
              item.maintenance_item_id,
              vehicle.current_km,
              new Date().toISOString().slice(0, 10)
            );
            await notifyDueSchedules(vehicleId);
            await reload();
          },
        },
      ]
    );
  }

  if (!vehicle) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nickname}>{vehicle.nickname}</Text>
        {vehicle.plate_number && <Text style={styles.plate}>{vehicle.plate_number}</Text>}

        <View style={styles.kmRow}>
          <View>
            <Text style={typography.caption}>Current odometer</Text>
            <Text style={styles.kmValue}>{vehicle.current_km.toLocaleString("en-US")} km</Text>
          </View>
          <Pressable style={styles.kmButton} onPress={() => setKmModalVisible(true)}>
            <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
            <Text style={styles.kmButtonText}>Update Odometer</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Maintenance Schedule</Text>}
        renderItem={({ item }) => {
          const status = STATUS_STYLE[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.item_name}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.fg }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>
                {item.due_km != null ? `Due at: ${item.due_km.toLocaleString("en-US")} km` : ""}
                {item.due_km != null && item.due_date ? " • " : ""}
                {item.due_date ? `by ${formatDueDate(item.due_date)}` : ""}
              </Text>
              <Pressable style={styles.doneButton} onPress={() => confirmMarkDone(item)}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.doneButtonText}>Mark as Done</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <UpdateKmModal
        visible={kmModalVisible}
        currentKm={vehicle.current_km}
        onCancel={() => setKmModalVisible(false)}
        onSubmit={handleUpdateKm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nickname: { ...typography.title },
  plate: { ...typography.caption, marginTop: 2 },
  kmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  kmValue: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 2 },
  kmButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  kmButtonText: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
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
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: "700" },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  doneButtonText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
