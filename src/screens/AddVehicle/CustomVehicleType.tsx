import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import FormField from "../../components/FormField";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "CustomVehicleType">;

export default function CustomVehicleType({ route, navigation }: Props) {
  const { vehicleClass, brandName: presetBrandName } = route.params;
  const [brandName, setBrandName] = useState(presetBrandName ?? "");
  const [modelName, setModelName] = useState("");

  function handleContinue() {
    if (!brandName.trim() || !modelName.trim()) {
      Alert.alert("Both fields are required", "Please enter a brand and a model name");
      return;
    }
    navigation.navigate("Details", {
      vehicleClass,
      brandName: brandName.trim(),
      vehicleTypeName: modelName.trim(),
    });
  }

  return (
    <View style={styles.container}>
      <WizardProgress step={presetBrandName ? 3 : 2} total={4} label="Enter Your Vehicle" />
      <Text style={styles.hint}>
        Not in our list yet - no problem. We&apos;ll use standard maintenance intervals until you have
        better data of your own.
      </Text>
      {presetBrandName ? (
        <Card style={styles.brandCard}>
          <Text style={styles.brandLabel}>Brand</Text>
          <Text style={styles.brandValue}>{presetBrandName}</Text>
        </Card>
      ) : (
        <FormField label="Brand" value={brandName} onChangeText={setBrandName} placeholder="e.g. Honda" />
      )}
      <FormField label="Model" value={modelName} onChangeText={setModelName} placeholder="e.g. Vario 125" />
      <View style={styles.continueWrap}>
        <PrimaryButton label="Continue" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  brandCard: {
    marginBottom: spacing.md,
  },
  brandLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  brandValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  continueWrap: {
    marginTop: spacing.lg,
  },
});
