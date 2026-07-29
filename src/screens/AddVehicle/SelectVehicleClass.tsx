import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { VehicleClass } from "../../types/models";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "SelectVehicleClass">;

const OPTIONS: { value: VehicleClass; label: string; icon: "motorbike" | "car" }[] = [
  { value: "motorcycle", label: "Motorcycle", icon: "motorbike" },
  { value: "car", label: "Car", icon: "car" },
];

export default function SelectVehicleClass({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <WizardProgress step={1} total={4} label="What are you adding?" />
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate("SelectBrand", { vehicleClass: option.value })}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={option.icon} size={28} color={colors.primary} />
          </View>
          <Text style={styles.label}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  label: { ...typography.body, fontWeight: "700", fontSize: 17 },
});
