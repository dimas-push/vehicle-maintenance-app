import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { listVehicles } from "../repositories/vehicleRepository";
import { listSchedulesForVehicle } from "../repositories/scheduleRepository";
import type { ScheduleStatus, Vehicle } from "../types/models";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../theme";
import { STATUS_LABEL, STATUS_STYLE, worstStatus } from "../utils/scheduleStatusPresentation";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { formatDistance } from "../utils/units";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleList">;

async function worstStatusFor(vehicleId: number): Promise<ScheduleStatus | null> {
  const schedules = await listSchedulesForVehicle(vehicleId);
  return worstStatus(schedules.map((s) => s.status));
}

export default function VehicleListScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<(Vehicle & { worstStatus: ScheduleStatus | null })[]>([]);
  const { unit } = useUnitPreference();

  useFocusEffect(
    useCallback(() => {
      listVehicles().then(async (list) => {
        const withStatus = await Promise.all(
          list.map(async (v) => ({ ...v, worstStatus: await worstStatusFor(v.id) }))
        );
        setVehicles(withStatus);
      });
    }, [])
  );

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="motorbike" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyText}>Add your first vehicle to start tracking its service schedule.</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const status = item.worstStatus ? STATUS_STYLE[item.worstStatus] : null;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
              >
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name="motorbike" size={22} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.nickname}</Text>
                  <Text style={styles.cardSub}>
                    {formatDistance(item.current_km, unit)}
                    {item.plate_number ? ` • ${item.plate_number}` : ""}
                  </Text>
                </View>
                {item.worstStatus && status && (
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.fg }]}>
                      {STATUS_LABEL[item.worstStatus]}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} style={styles.chevron} />
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate("AddVehicle")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIconWrap: {
    width: 72,
    height: 72,
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
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardPressed: { backgroundColor: colors.primarySoft },
  chevron: { marginLeft: spacing.xs },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 10px rgba(37, 99, 235, 0.35)",
    elevation: 4,
  },
  fabPressed: { backgroundColor: colors.primaryDark },
});
