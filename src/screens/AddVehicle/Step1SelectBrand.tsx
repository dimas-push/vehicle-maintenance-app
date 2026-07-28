import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listBrands } from "../../repositories/catalogRepository";
import type { Brand } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectBrand">;

export default function Step1SelectBrand({ navigation }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    listBrands().then(setBrands);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Langkah 1 dari 3: Pilih Merek</Text>
      <FlatList
        data={brands}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              navigation.navigate("SelectType", { brandId: item.id, brandName: item.name })
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
