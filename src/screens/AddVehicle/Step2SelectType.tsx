import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listVehicleTypesByBrand } from "../../repositories/catalogRepository";
import type { VehicleType } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectType">;

export default function Step2SelectType({ route, navigation }: Props) {
  const { brandId, brandName } = route.params;
  const [types, setTypes] = useState<VehicleType[]>([]);

  useEffect(() => {
    listVehicleTypesByBrand(brandId).then(setTypes);
  }, [brandId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Langkah 2 dari 3: Pilih Tipe {brandName}</Text>
      <FlatList
        data={types}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              navigation.navigate("Details", {
                brandId,
                brandName,
                vehicleTypeId: item.id,
                vehicleTypeName: item.name,
              })
            }
          >
            <Text style={styles.itemText}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  item: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: { fontSize: 16 },
});
