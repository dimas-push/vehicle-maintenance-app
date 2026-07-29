import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import {
  findMaintenanceItemByName,
  findVehicleTypeByNames,
  getVehicleTypeWithBrandName,
} from "../repositories/catalogRepository";
import { createVehicle, listVehicles } from "../repositories/vehicleRepository";
import {
  listMaintenanceRecords,
  recalculateSchedules,
  recordMaintenanceDone,
} from "../repositories/scheduleRepository";
import { notifyDueSchedules } from "./notifications";

const BACKUP_FORMAT_VERSION = 1;

interface BackupRecord {
  item_name: string;
  done_at_km: number;
  done_at_date: string;
  notes: string | null;
}

interface BackupVehicle {
  nickname: string;
  plate_number: string | null;
  purchase_date: string | null;
  current_km: number;
  brand: string;
  vehicleType: string;
  records: BackupRecord[];
}

interface BackupFile {
  formatVersion: number;
  exportedAt: string;
  vehicles: BackupVehicle[];
}

async function buildBackupData(): Promise<BackupFile> {
  const vehicles = await listVehicles();

  const backupVehicles: BackupVehicle[] = [];
  for (const vehicle of vehicles) {
    const typeInfo = await getVehicleTypeWithBrandName(vehicle.vehicle_type_id);
    if (!typeInfo) continue;

    const records = await listMaintenanceRecords(vehicle.id);

    backupVehicles.push({
      nickname: vehicle.nickname,
      plate_number: vehicle.plate_number,
      purchase_date: vehicle.purchase_date,
      current_km: vehicle.current_km,
      brand: typeInfo.brandName,
      vehicleType: typeInfo.typeName,
      records: records.map((r) => ({
        item_name: r.item_name,
        done_at_km: r.done_at_km,
        done_at_date: r.done_at_date,
        notes: r.notes,
      })),
    });
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    vehicles: backupVehicles,
  };
}

function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `vehicle-maintenance-backup-${stamp}.json`;
}

export async function exportBackup(): Promise<void> {
  const data = await buildBackupData();
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
  } else {
    throw new Error("Sharing isn't available on this device.");
  }
}

export interface ImportSummary {
  vehiclesImported: number;
  vehiclesSkipped: string[];
}

export async function importBackup(): Promise<ImportSummary | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "*/*"],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;

  const asset = picked.assets[0];
  const text =
    Platform.OS === "web" && asset.file
      ? await asset.file.text()
      : await new File(asset.uri).text();

  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid backup data (couldn't parse JSON).");
  }
  if (!Array.isArray(data.vehicles)) {
    throw new Error("This file isn't valid backup data (missing vehicles list).");
  }

  const summary: ImportSummary = { vehiclesImported: 0, vehiclesSkipped: [] };

  for (const backupVehicle of data.vehicles) {
    const vehicleType = await findVehicleTypeByNames(backupVehicle.brand, backupVehicle.vehicleType);
    if (!vehicleType) {
      summary.vehiclesSkipped.push(`${backupVehicle.brand} ${backupVehicle.vehicleType}`);
      continue;
    }

    const vehicle = await createVehicle({
      vehicle_type_id: vehicleType.id,
      nickname: backupVehicle.nickname,
      plate_number: backupVehicle.plate_number,
      purchase_date: backupVehicle.purchase_date,
      current_km: backupVehicle.current_km,
    });

    for (const record of backupVehicle.records) {
      const item = await findMaintenanceItemByName(record.item_name);
      if (!item) continue;
      await recordMaintenanceDone(
        vehicle.id,
        item.id,
        record.done_at_km,
        record.done_at_date,
        record.notes ?? undefined
      );
    }

    await recalculateSchedules(vehicle.id);
    await notifyDueSchedules(vehicle.id);
    summary.vehiclesImported += 1;
  }

  return summary;
}
