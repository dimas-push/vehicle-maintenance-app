import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VehicleTabs from "./VehicleTabs";
import AddVehicleWizard from "../screens/AddVehicle/AddVehicleWizard";
import VehicleDetailScreen from "../screens/VehicleDetail/VehicleDetailScreen";
import MaintenanceHistoryScreen from "../screens/VehicleDetail/MaintenanceHistoryScreen";
import FuelLogScreen from "../screens/VehicleDetail/FuelLogScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  Tabs: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: number };
  MaintenanceHistory: { vehicleId: number; nickname: string };
  FuelLog: { vehicleId: number; nickname: string };
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
      <Stack.Screen name="Tabs" component={VehicleTabs} options={{ headerShown: false }} />
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
      <Stack.Screen
        name="MaintenanceHistory"
        component={MaintenanceHistoryScreen}
        options={({ route }) => ({ headerTitle: `${route.params.nickname} — History` })}
      />
      <Stack.Screen
        name="FuelLog"
        component={FuelLogScreen}
        options={({ route }) => ({ headerTitle: `${route.params.nickname} — Fuel` })}
      />
    </Stack.Navigator>
  );
}
