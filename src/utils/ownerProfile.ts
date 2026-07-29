import AsyncStorage from "@react-native-async-storage/async-storage";

const NAME_KEY = "owner_profile_name";
const PHONE_KEY = "owner_profile_phone";
const EMAIL_KEY = "owner_profile_email";
const PHOTO_KEY = "owner_profile_photo_uri";

export interface OwnerProfile {
  name: string | null;
  phone: string | null;
  email: string | null;
  photoUri: string | null;
}

const EMPTY_PROFILE: OwnerProfile = { name: null, phone: null, email: null, photoUri: null };

export async function getOwnerProfile(): Promise<OwnerProfile> {
  const [name, phone, email, photoUri] = await Promise.all([
    AsyncStorage.getItem(NAME_KEY),
    AsyncStorage.getItem(PHONE_KEY),
    AsyncStorage.getItem(EMAIL_KEY),
    AsyncStorage.getItem(PHOTO_KEY),
  ]);
  return { name, phone, email, photoUri };
}

export async function setOwnerProfile(profile: OwnerProfile): Promise<void> {
  const entries: [string, string][] = [];
  const removals: string[] = [];

  const fields: [string, string | null][] = [
    [NAME_KEY, profile.name],
    [PHONE_KEY, profile.phone],
    [EMAIL_KEY, profile.email],
    [PHOTO_KEY, profile.photoUri],
  ];
  for (const [key, value] of fields) {
    if (value) entries.push([key, value]);
    else removals.push(key);
  }

  await Promise.all([
    entries.length > 0 ? AsyncStorage.multiSet(entries) : Promise.resolve(),
    removals.length > 0 ? AsyncStorage.multiRemove(removals) : Promise.resolve(),
  ]);
}

export function isOwnerProfileEmpty(profile: OwnerProfile): boolean {
  return profile.name == null && profile.phone == null && profile.email == null && profile.photoUri == null;
}

export { EMPTY_PROFILE };
