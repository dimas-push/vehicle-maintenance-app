import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUnitPreference } from "../context/UnitPreferenceContext";
import type { DistanceUnit } from "../utils/units";
import { colors, radius, shadow, spacing, typography } from "../theme";

const OPTIONS: { value: DistanceUnit; label: string; hint: string }[] = [
  { value: "km", label: "Kilometers", hint: "Used in most of the world" },
  { value: "mi", label: "Miles", hint: "Used in the US and UK" },
];

export default function SettingsScreen() {
  const { unit, setUnit } = useUnitPreference();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Distance Unit</Text>
      {OPTIONS.map((option) => {
        const selected = option.value === unit;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setUnit(option.value)}
          >
            <View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionHint}>{option.hint}</Text>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  optionSelected: { borderColor: colors.primary },
  optionLabel: { ...typography.body, fontWeight: "700" },
  optionHint: { ...typography.caption, marginTop: 2 },
});
