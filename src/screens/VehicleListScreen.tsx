import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listVehicles } from "../repositories/vehicleRepository";
import type { Vehicle } from "../types/models";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleList">;

export default function VehicleListScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useFocusEffect(
    useCallback(() => {
      listVehicles().then(setVehicles);
    }, [])
  );

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Belum ada kendaraan. Tambahkan yang pertama.</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => String(v.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nickname}</Text>
              <Text style={styles.cardSub}>
                {item.current_km.toLocaleString("id-ID")} km
                {item.plate_number ? ` • ${item.plate_number}` : ""}
              </Text>
            </View>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddVehicle")}>
        <Text style={styles.fabText}>+ Tambah Kendaraan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#666", fontSize: 15, textAlign: "center" },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSub: { fontSize: 14, color: "#666", marginTop: 4 },
  fab: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
