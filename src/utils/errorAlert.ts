import { Alert } from "react-native";

/** Extracts a human-readable message from a caught value of unknown type. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Consistent one-line way to surface a failed async action to the user. */
export function showErrorAlert(title: string, err: unknown): void {
  Alert.alert(title, errorMessage(err));
}
