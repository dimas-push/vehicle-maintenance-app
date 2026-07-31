import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listBrandsByClass } from "../../repositories/catalogRepository";
import type { Brand } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import Card from "../../components/Card";
import ListRow from "../../components/ListRow";
import { showErrorAlert } from "../../utils/errorAlert";
import { colors, spacing } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectBrand">;

export default function Step1SelectBrand({ route, navigation }: Props) {
  const { vehicleClass } = route.params;
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    listBrandsByClass(vehicleClass)
      .then(setBrands)
      .catch((err) => showErrorAlert("Couldn't load brands", err));
  }, [vehicleClass]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={brands}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<WizardProgress step={2} total={4} label="Select Brand" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <ListRow
              title={item.name}
              onPress={() =>
                navigation.navigate("SelectType", {
                  vehicleClass,
                  brandId: item.id,
                  brandName: item.name,
                })
              }
            />
          </Card>
        )}
        ListFooterComponent={
          <Card style={styles.row}>
            <ListRow
              title="My brand isn't listed"
              onPress={() => navigation.navigate("CustomVehicleType", { vehicleClass })}
            />
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  row: { marginBottom: spacing.sm },
});
