import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VehicleListScreen from "../screens/VehicleListScreen";
import AddVehicleWizard from "../screens/AddVehicle/AddVehicleWizard";

export type RootStackParamList = {
  VehicleList: undefined;
  AddVehicle: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VehicleList"
        component={VehicleListScreen}
        options={{ headerTitle: "Kendaraan Saya" }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleWizard}
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
