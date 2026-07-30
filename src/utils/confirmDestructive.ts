import { Alert } from "react-native";

/** The "Delete this X?" confirmation Alert.alert pattern, duplicated per screen before this rebuild. */
export function confirmDestructive(title: string, message: string, onConfirm: () => void): void {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}
