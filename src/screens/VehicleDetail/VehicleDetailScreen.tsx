import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteVehicle,
  getVehicle,
  updateCurrentKm,
  updateVehicleDetails,
} from "../../repositories/vehicleRepository";
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
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance } from "../../utils/units";
import UpdateKmModal from "./UpdateKmModal";
import EditVehicleModal from "./EditVehicleModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;
type ScheduleRow = MaintenanceSchedule & { item_name: string };

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [kmModalVisible, setKmModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { unit } = useUnitPreference();

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

  function handleDelete() {
    if (!vehicle) return;
    Alert.alert(
      "Delete this vehicle?",
      `${vehicle.nickname} and all its service history will be permanently removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVehicle(vehicleId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  async function handleEditSave(nickname: string, plateNumber: string | null) {
    setEditModalVisible(false);
    await updateVehicleDetails(vehicleId, { nickname, plate_number: plateNumber });
    await reload();
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={() => setEditModalVisible(true)} hitSlop={8}>
            <Ionicons name="pencil-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, vehicle]);

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
      `${item.item_name} will be logged as done today at ${formatDistance(vehicle.current_km, unit)}.`,
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
            <Text style={styles.kmValue}>{formatDistance(vehicle.current_km, unit)}</Text>
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
                {item.due_km != null ? `Due at: ${formatDistance(item.due_km, unit)}` : ""}
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
        unit={unit}
        onCancel={() => setKmModalVisible(false)}
        onSubmit={handleUpdateKm}
      />

      <EditVehicleModal
        visible={editModalVisible}
        nickname={vehicle.nickname}
        plateNumber={vehicle.plate_number}
        onCancel={() => setEditModalVisible(false)}
        onSubmit={handleEditSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerActions: { flexDirection: "row", gap: spacing.md, marginRight: spacing.sm },
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
