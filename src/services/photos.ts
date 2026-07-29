import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";

const PHOTOS_DIR_NAME = "vehicle-photos";

function getPhotosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) dir.create();
  return dir;
}

async function persistPickedAsset(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (Platform.OS === "web") {
    // No durable native filesystem on web — store the image inline as a data URI.
    if (asset.base64) return `data:image/jpeg;base64,${asset.base64}`;
    return asset.uri;
  }

  const source = new File(asset.uri);
  const extension = asset.uri.split(".").pop()?.split("?")[0] || "jpg";
  const destination = new File(getPhotosDirectory(), `${Date.now()}.${extension}`);
  await source.copy(destination);
  return destination.uri;
}

async function launch(
  fn: () => Promise<ImagePicker.ImagePickerResult>
): Promise<string | null> {
  const result = await fn();
  if (result.canceled || !result.assets?.[0]) return null;
  return persistPickedAsset(result.assets[0]);
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.6,
  allowsEditing: true,
  aspect: [4, 3],
  base64: Platform.OS === "web",
};

export async function pickVehiclePhotoFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Photo library permission was denied.");
  return launch(() => ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
}

export async function takeVehiclePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error("Camera permission was denied.");
  return launch(() => ImagePicker.launchCameraAsync(PICKER_OPTIONS));
}

export function deleteVehiclePhoto(photoUri: string | null): void {
  if (!photoUri || Platform.OS === "web" || !photoUri.startsWith(Paths.document.uri)) return;
  try {
    new File(photoUri).delete();
  } catch {
    // Best-effort cleanup — a missing file is not an error worth surfacing.
  }
}
