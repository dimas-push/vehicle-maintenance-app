import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Step1SelectBrand from "./Step1SelectBrand";
import Step2SelectType from "./Step2SelectType";
import Step3Details from "./Step3Details";
import type { AddVehicleStackParamList } from "./WizardContext";

const Stack = createNativeStackNavigator<AddVehicleStackParamList>();

export default function AddVehicleWizard() {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: "Tambah Kendaraan" }}>
      <Stack.Screen name="SelectBrand" component={Step1SelectBrand} options={{ headerTitle: "Pilih Merek" }} />
      <Stack.Screen name="SelectType" component={Step2SelectType} options={{ headerTitle: "Pilih Tipe" }} />
      <Stack.Screen name="Details" component={Step3Details} options={{ headerTitle: "Detail Kendaraan" }} />
    </Stack.Navigator>
  );
}
