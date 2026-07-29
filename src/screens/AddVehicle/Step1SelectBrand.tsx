import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { listBrandsByClass } from "../../repositories/catalogRepository";
import type { Brand } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectBrand">;

export default function Step1SelectBrand({ route, navigation }: Props) {
  const { vehicleClass } = route.params;
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    listBrandsByClass(vehicleClass).then(setBrands);
  }, [vehicleClass]);

  return (
    <View style={styles.container}>
      <WizardProgress step={2} total={4} label="Select Brand" />
      <FlatList
        data={brands}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() =>
              navigation.navigate("SelectType", { vehicleClass, brandId: item.id, brandName: item.name })
            }
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable
            style={({ pressed }) => [styles.item, styles.otherItem, pressed && styles.itemPressed]}
            onPress={() => navigation.navigate("CustomVehicleType", { vehicleClass })}
          >
            <Text style={styles.otherItemText}>My brand isn't listed</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  itemPressed: { backgroundColor: colors.primarySoft },
  itemText: { ...typography.body, fontWeight: "600" },
  otherItem: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  otherItemText: { ...typography.body, color: colors.textMuted },
});
