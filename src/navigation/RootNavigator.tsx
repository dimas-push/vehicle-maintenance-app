import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VehicleListScreen from "../screens/VehicleListScreen";
import AddVehicleWizard from "../screens/AddVehicle/AddVehicleWizard";
import VehicleDetailScreen from "../screens/VehicleDetail/VehicleDetailScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  VehicleList: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="VehicleList"
        component={VehicleListScreen}
        options={{ headerTitle: "My Vehicles" }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleWizard}
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ headerTitle: "Vehicle Details" }}
      />
    </Stack.Navigator>
  );
}
