import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AddVehicleStackParamList } from "./WizardContext";
import WizardProgress from "../../components/WizardProgress";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "CustomVehicleType">;

export default function CustomVehicleType({ route, navigation }: Props) {
  const presetBrandName = route.params?.brandName;
  const [brandName, setBrandName] = useState(presetBrandName ?? "");
  const [modelName, setModelName] = useState("");

  function handleContinue() {
    if (!brandName.trim() || !modelName.trim()) {
      Alert.alert("Both fields are required", "Please enter a brand and a model name");
      return;
    }
    navigation.navigate("Details", {
      brandName: brandName.trim(),
      vehicleTypeName: modelName.trim(),
    });
  }

  return (
    <View style={styles.container}>
      <WizardProgress step={2} total={3} label="Enter Your Vehicle" />
      <Text style={styles.hint}>
        Not in our list yet — no problem. We'll use standard maintenance intervals until you have
        better data of your own.
      </Text>

      {presetBrandName ? (
        <>
          <Text style={styles.label}>Brand</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>{presetBrandName}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kawasaki"
            placeholderTextColor={colors.textSubtle}
            value={brandName}
            onChangeText={setBrandName}
          />
        </>
      )}

      <Text style={styles.label}>Model</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Ninja 250"
        placeholderTextColor={colors.textSubtle}
        value={modelName}
        onChangeText={setModelName}
      />

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  label: { ...typography.label, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    fontSize: 15,
    color: colors.text,
    ...shadow.card,
  },
  readonlyField: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
  },
  readonlyText: { ...typography.body, fontWeight: "700", color: colors.primaryDark },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md - 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
