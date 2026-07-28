import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createVehicle } from "../../repositories/vehicleRepository";
import { recalculateSchedules } from "../../repositories/scheduleRepository";
import type { AddVehicleStackParamList } from "./WizardContext";
import { Pressable } from "react-native";

type Props = NativeStackScreenProps<AddVehicleStackParamList, "Details">;

export default function Step3Details({ route, navigation }: Props) {
  const { brandName, vehicleTypeId, vehicleTypeName } = route.params;
  const [nickname, setNickname] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const km = Number(currentKm);
    if (!nickname.trim()) {
      Alert.alert("Nama kendaraan wajib diisi", "Contoh: \"Motor Ayah\" atau \"Vario Biru\"");
      return;
    }
    if (!Number.isFinite(km) || km < 0) {
      Alert.alert("KM saat ini tidak valid", "Masukkan angka kilometer yang benar");
      return;
    }

    setSaving(true);
    try {
      const vehicle = await createVehicle({
        vehicle_type_id: vehicleTypeId,
        nickname: nickname.trim(),
        plate_number: plateNumber.trim() || null,
        current_km: km,
      });
      await recalculateSchedules(vehicle.id);
      navigation.getParent()?.goBack();
    } catch (err) {
      Alert.alert("Gagal menyimpan", String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Langkah 3 dari 3: Detail Kendaraan</Text>
      <Text style={styles.subtitle}>
        {brandName} {vehicleTypeName}
      </Text>

      <Text style={styles.label}>Nama kendaraan</Text>
      <TextInput
        style={styles.input}
        placeholder="Motor Ayah"
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>Nomor plat (opsional)</Text>
      <TextInput
        style={styles.input}
        placeholder="B 1234 XYZ"
        value={plateNumber}
        onChangeText={setPlateNumber}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>KM saat ini</Text>
      <TextInput
        style={styles.input}
        placeholder="12000"
        value={currentKm}
        onChangeText={setCurrentKm}
        keyboardType="numeric"
      />

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? "Menyimpan..." : "Simpan Kendaraan"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
