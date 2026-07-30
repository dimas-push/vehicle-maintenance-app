import { Alert, Linking, Platform } from "react-native";

/**
 * Thrown when a native permission (camera, photo library, ...) is denied.
 * canAskAgain mirrors the Expo permission response: once it's false, the OS
 * won't show its prompt again and the only way forward is the Settings app.
 */
export class PermissionDeniedError extends Error {
  canAskAgain: boolean;

  constructor(message: string, canAskAgain: boolean) {
    super(message);
    this.name = "PermissionDeniedError";
    this.canAskAgain = canAskAgain;
  }
}

/** Extracts a human-readable message from a caught value of unknown type. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Consistent one-line way to surface a failed async action to the user. When
 * the failure is a permanently-denied permission, offers a direct path to
 * the Settings app instead of a dead-end message.
 */
export function showErrorAlert(title: string, err: unknown): void {
  if (err instanceof PermissionDeniedError && !err.canAskAgain && Platform.OS !== "web") {
    Alert.alert(title, `${err.message} You can enable it from your device settings.`, [
      { text: "Not Now", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ]);
    return;
  }
  Alert.alert(title, errorMessage(err));
}
