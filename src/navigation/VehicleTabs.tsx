import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import VehicleListScreen from "../screens/VehicleListScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { colors } from "../theme";

export type VehicleTabsParamList = {
  Vehicles: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<VehicleTabsParamList>();

export default function VehicleTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Vehicles"
        component={VehicleListScreen}
        options={{
          headerTitle: "My Vehicles",
          tabBarLabel: "Vehicles",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="motorbike" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
