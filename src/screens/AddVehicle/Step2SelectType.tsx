import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { listVehicleTypesByBrand } from "../../repositories/catalogRepository";
import type { VehicleType } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import Card from "../../components/Card";
import ListRow from "../../components/ListRow";
import { showErrorAlert } from "../../utils/errorAlert";
import { spacing } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectType">;

export default function Step2SelectType({ route, navigation }: Props) {
  const { vehicleClass, brandId, brandName } = route.params;
  const [types, setTypes] = useState<VehicleType[]>([]);

  useEffect(() => {
    listVehicleTypesByBrand(brandId, vehicleClass)
      .then(setTypes)
      .catch((err) => showErrorAlert("Couldn't load models", err));
  }, [brandId, vehicleClass]);

  return (
    <FlatList
      data={types}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.md }}
      ListHeaderComponent={
        <WizardProgress step={3} total={4} label={`Select ${brandName} Model`} />
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: spacing.md }}>
          <Card>
            <ListRow
              title={item.name}
              onPress={() =>
                navigation.navigate("Details", {
                  vehicleClass,
                  brandName,
                  vehicleTypeId: item.id,
                  vehicleTypeName: item.name,
                })
              }
            />
          </Card>
        </View>
      )}
      ListFooterComponent={
        <Card>
          <ListRow
            title="My model isn't listed"
            onPress={() => navigation.navigate("CustomVehicleType", { vehicleClass, brandName })}
          />
        </Card>
      }
    />
  );
}
