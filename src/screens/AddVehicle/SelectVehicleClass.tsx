import { ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { VehicleClass } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import Card from "../../components/Card";
import ListRow from "../../components/ListRow";
import { colors, spacing } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectVehicleClass">;

const OPTIONS: { value: VehicleClass; label: string; icon: "motorbike" | "car" }[] = [
  { value: "motorcycle", label: "Motorcycle", icon: "motorbike" },
  { value: "car", label: "Car", icon: "car" },
];

export default function SelectVehicleClass({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WizardProgress step={1} total={4} label="What are you adding?" />
      {OPTIONS.map((option) => (
        <Card key={option.value} style={styles.cardSpacing}>
          <ListRow
            leading={<MaterialCommunityIcons name={option.icon} size={28} color={colors.primary} />}
            title={option.label}
            showChevron={false}
            onPress={() => navigation.navigate("SelectBrand", { vehicleClass: option.value })}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  cardSpacing: { marginBottom: spacing.sm },
});
