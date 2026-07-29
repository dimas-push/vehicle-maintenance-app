import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { storage } from "./firebase";
import { applyBackupData, buildBackupData, parseBackupJson, type ImportSummary } from "./backup";

function backupPath(uid: string): string {
  return `backups/${uid}/backup.json`;
}

function isNotFoundError(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "storage/object-not-found";
}

/** Uploads a fresh backup snapshot to this account's private cloud path, overwriting any previous one. */
export async function backupToCloud(uid: string): Promise<void> {
  if (!storage) throw new Error("Cloud backup isn't set up yet.");
  const data = await buildBackupData();
  await uploadString(ref(storage, backupPath(uid)), JSON.stringify(data), "raw");
}

/** Returns null if this account has never backed up to the cloud, rather than treating it as an error. */
export async function restoreFromCloud(uid: string): Promise<ImportSummary | null> {
  if (!storage) throw new Error("Cloud backup isn't set up yet.");

  let url: string;
  try {
    url = await getDownloadURL(ref(storage, backupPath(uid)));
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }

  const response = await fetch(url);
  const text = await response.text();
  return applyBackupData(parseBackupJson(text));
}
