import { useState } from "react";
import { Alert } from "react-native";
import type { FuelType, Transmission, VehicleClass } from "../../types/models";
import { FUEL_TYPE_LABEL, TRANSMISSION_LABEL } from "../../utils/vehicleSpecs";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";
import { Chip, ChipGroup } from "../../components/Chip";

export interface EditVehicleSubmitValues {
  nickname: string;
  plateNumber: string | null;
  vin: string | null;
  year: number | null;
  color: string | null;
  engineSize: string | null;
  transmission: Transmission | null;
  fuelType: FuelType | null;
}

const TRANSMISSION_OPTIONS = (Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((value) => ({
  value,
  label: TRANSMISSION_LABEL[value],
}));
const FUEL_TYPE_OPTIONS = (Object.keys(FUEL_TYPE_LABEL) as FuelType[]).map((value) => ({
  value,
  label: FUEL_TYPE_LABEL[value],
}));

export default function EditVehicleModal({
  visible,
  vehicleClass,
  nickname: initialNickname,
  plateNumber: initialPlateNumber,
  vin: initialVin,
  year: initialYear,
  color: initialColor,
  engineSize: initialEngineSize,
  transmission: initialTransmission,
  fuelType: initialFuelType,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  vehicleClass: VehicleClass;
  nickname: string;
  plateNumber: string | null;
  vin: string | null;
  year: number | null;
  color: string | null;
  engineSize: string | null;
  transmission: Transmission | null;
  fuelType: FuelType | null;
  onCancel: () => void;
  onSubmit: (values: EditVehicleSubmitValues) => void;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [plateNumber, setPlateNumber] = useState(initialPlateNumber ?? "");
  const [vin, setVin] = useState(initialVin ?? "");
  const [year, setYear] = useState(initialYear ? String(initialYear) : "");
  const [color, setColor] = useState(initialColor ?? "");
  const [engineSize, setEngineSize] = useState(initialEngineSize ?? "");
  const [transmission, setTransmission] = useState<Transmission | null>(initialTransmission);
  const [fuelType, setFuelType] = useState<FuelType | null>(initialFuelType);
  const isCar = vehicleClass === "car";

  function handleSubmit() {
    if (!nickname.trim()) {
      Alert.alert("Vehicle name is required", "Please enter a name for this vehicle");
      return;
    }
    const yearValue = year.trim() ? Number(year) : null;
    if (yearValue != null && (!Number.isFinite(yearValue) || yearValue < 1900 || yearValue > 2100)) {
      Alert.alert("Invalid year", "Please enter a valid 4-digit year, or leave it blank");
      return;
    }
    onSubmit({
      nickname: nickname.trim(),
      plateNumber: plateNumber.trim() || null,
      vin: vin.trim() || null,
      year: yearValue,
      color: color.trim() || null,
      engineSize: engineSize.trim() || null,
      transmission,
      fuelType,
    });
  }

  return (
    <FormSheet visible={visible} title="Edit Vehicle" onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Save">
      <FormField label="Vehicle name" value={nickname} onChangeText={setNickname} placeholder="e.g. My Daily Ride" />
      <FormField label="Plate number" value={plateNumber} onChangeText={setPlateNumber} placeholder="e.g. B 1234 ABC" />
      <FormField label="VIN" value={vin} onChangeText={setVin} placeholder="Vehicle identification number" />
      <FormField label="Year" value={year} onChangeText={setYear} placeholder={isCar ? "e.g. 2020" : "e.g. 2022"} numeric />
      <FormField label="Color" value={color} onChangeText={setColor} placeholder="e.g. Black" />
      <FormField
        label="Engine size"
        value={engineSize}
        onChangeText={setEngineSize}
        placeholder={isCar ? "e.g. 1.5L" : "e.g. 150cc"}
      />
      <ChipGroup>
        {TRANSMISSION_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={transmission === option.value}
            onPress={() => setTransmission((current) => (current === option.value ? null : option.value))}
          />
        ))}
      </ChipGroup>
      <ChipGroup>
        {FUEL_TYPE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={fuelType === option.value}
            onPress={() => setFuelType((current) => (current === option.value ? null : option.value))}
          />
        ))}
      </ChipGroup>
    </FormSheet>
  );
}
