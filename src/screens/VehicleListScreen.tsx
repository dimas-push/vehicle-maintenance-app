import { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { listVehicles } from "../repositories/vehicleRepository";
import type { VehicleWithClass } from "../repositories/vehicleRepository";
import { listSchedulesForVehicle } from "../repositories/scheduleRepository";
import type { ScheduleStatus } from "../types/models";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { VehicleTabsParamList } from "../navigation/VehicleTabs";
import { colors, spacing } from "../theme";
import { STATUS_LABEL, STATUS_STYLE, worstStatus } from "../utils/scheduleStatusPresentation";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import { formatDistance } from "../utils/units";
import { vehicleClassIcon } from "../utils/vehicleIcon";
import { showErrorAlert } from "../utils/errorAlert";
import { useAsyncData, useFocusRefresh } from "../hooks/useAsyncData";
import Card from "../components/Card";
import ListRow from "../components/ListRow";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import FAB from "../components/FAB";

type Props = CompositeScreenProps<
  BottomTabScreenProps<VehicleTabsParamList, "Vehicles">,
  NativeStackScreenProps<RootStackParamList>
>;

type VehicleRow = VehicleWithClass & { worstStatus: ScheduleStatus | null };

async function loadVehiclesWithStatus(): Promise<VehicleRow[]> {
  const list = await listVehicles();
  return Promise.all(
    list.map(async (v) => {
      const schedules = await listSchedulesForVehicle(v.id);
      return { ...v, worstStatus: worstStatus(schedules.map((s) => s.status)) };
    })
  );
}

export default function VehicleListScreen({ navigation }: Props) {
  const { unit } = useUnitPreference();
  const { data, loading, error, reload } = useAsyncData(useCallback(() => loadVehiclesWithStatus(), []));
  useFocusRefresh(reload);

  useEffect(() => {
    if (error) showErrorAlert("Couldn't load vehicles", error);
  }, [error]);

  const vehicles = data ?? [];

  return (
    <View style={styles.container}>
      {loading && data === null ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<MaterialCommunityIcons name="motorbike" size={40} color={colors.primary} />}
          title="No vehicles yet"
          caption="Add your first vehicle to start tracking its service schedule."
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const status = item.worstStatus ? STATUS_STYLE[item.worstStatus] : null;
            return (
              <Card style={styles.cardSpacing}>
                <ListRow
                  leading={
                    item.photo_uri ? (
                      <Image source={{ uri: item.photo_uri }} style={styles.photo} />
                    ) : (
                      <MaterialCommunityIcons name={vehicleClassIcon(item.vehicle_class)} size={22} color={colors.primary} />
                    )
                  }
                  title={item.nickname}
                  subtitle={`${formatDistance(item.current_km, unit)}${item.plate_number ? ` • ${item.plate_number}` : ""}`}
                  trailing={
                    item.worstStatus && status ? (
                      <StatusBadge label={STATUS_LABEL[item.worstStatus]} bg={status.bg} fg={status.fg} />
                    ) : undefined
                  }
                  onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
                />
              </Card>
            );
          }}
        />
      )}

      <FAB
        icon={<Ionicons name="add" size={28} color={colors.onPrimary} />}
        onPress={() => navigation.navigate("AddVehicle")}
        accessibilityLabel="Add vehicle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  cardSpacing: { marginBottom: spacing.sm },
  photo: { width: 44, height: 44 },
});
