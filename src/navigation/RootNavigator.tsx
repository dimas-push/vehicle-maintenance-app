import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import VehicleListScreen from "../screens/VehicleListScreen";
import AddVehicleWizard from "../screens/AddVehicle/AddVehicleWizard";
import VehicleDetailScreen from "../screens/VehicleDetail/VehicleDetailScreen";
import MaintenanceHistoryScreen from "../screens/VehicleDetail/MaintenanceHistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  VehicleList: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: number };
  MaintenanceHistory: { vehicleId: number; nickname: string };
  Settings: undefined;
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
        options={({ navigation }) => ({
          headerTitle: "My Vehicles",
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate("Settings")} hitSlop={8}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </Pressable>
          ),
        })}
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
      <Stack.Screen
        name="MaintenanceHistory"
        component={MaintenanceHistoryScreen}
        options={({ route }) => ({ headerTitle: `${route.params.nickname} — History` })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: "Settings" }}
      />
    </Stack.Navigator>
  );
}
