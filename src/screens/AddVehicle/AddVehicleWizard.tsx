import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Step1SelectBrand from "./Step1SelectBrand";
import Step2SelectType from "./Step2SelectType";
import CustomVehicleType from "./CustomVehicleType";
import Step3Details from "./Step3Details";
import type { AddVehicleStackParamList } from "./WizardContext";
import { colors } from "../../theme";

const Stack = createNativeStackNavigator<AddVehicleStackParamList>();

export default function AddVehicleWizard() {
  return (
    <Stack.Navigator
      screenOptions={{
        // Step titles are already shown in WizardProgress within the content,
        // the header just needs the back button.
        headerTitle: "",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="SelectBrand" component={Step1SelectBrand} />
      <Stack.Screen name="SelectType" component={Step2SelectType} />
      <Stack.Screen name="CustomVehicleType" component={CustomVehicleType} />
      <Stack.Screen name="Details" component={Step3Details} />
    </Stack.Navigator>
  );
}
