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
import { createDocument, listDocumentsForVehicle } from "../repositories/documentRepository";
import { createFuelLog, listFuelLogs } from "../repositories/fuelRepository";
import type { DocumentType } from "../types/models";
import { notifyDueSchedules } from "./notifications";

// Bumped from 2 to 3 to add VIN and fuel logs — older backups still import
// fine since the new fields are optional on read.
const BACKUP_FORMAT_VERSION = 3;

interface BackupRecord {
  item_name: string;
  done_at_km: number;
  done_at_date: string;
  cost: number | null;
  notes: string | null;
}

interface BackupDocument {
  document_type: DocumentType;
  label: string;
  expiry_date: string;
  notes: string | null;
}

interface BackupFuelLog {
  filled_at_km: number;
  filled_at_date: string;
  volume_liters: number;
  cost: number | null;
  full_tank: boolean;
  notes: string | null;
}

interface BackupVehicle {
  nickname: string;
  plate_number: string | null;
  vin?: string | null;
  purchase_date: string | null;
  current_km: number;
  brand: string;
  vehicleType: string;
  records: BackupRecord[];
  documents?: BackupDocument[];
  fuelLogs?: BackupFuelLog[];
}

interface BackupFile {
  formatVersion: number;
  exportedAt: string;
  vehicles: BackupVehicle[];
}

async function buildBackupData(): Promise<BackupFile> {
  const vehicles = await listVehicles();

  // Photos (vehicle, per-record, odometer) are intentionally not included —
  // they're local file paths (or, on web, large inline data URIs) that
  // wouldn't resolve on a different device anyway.
  const backupVehicles: BackupVehicle[] = [];
  for (const vehicle of vehicles) {
    const typeInfo = await getVehicleTypeWithBrandName(vehicle.vehicle_type_id);
    if (!typeInfo) continue;

    const records = await listMaintenanceRecords(vehicle.id);
    const documents = await listDocumentsForVehicle(vehicle.id);
    const fuelLogs = await listFuelLogs(vehicle.id);

    backupVehicles.push({
      nickname: vehicle.nickname,
      plate_number: vehicle.plate_number,
      vin: vehicle.vin,
      purchase_date: vehicle.purchase_date,
      current_km: vehicle.current_km,
      brand: typeInfo.brandName,
      vehicleType: typeInfo.typeName,
      records: records.map((r) => ({
        item_name: r.item_name,
        done_at_km: r.done_at_km,
        done_at_date: r.done_at_date,
        cost: r.cost,
        notes: r.notes,
      })),
      documents: documents.map((d) => ({
        document_type: d.document_type,
        label: d.label,
        expiry_date: d.expiry_date,
        notes: d.notes,
      })),
      fuelLogs: fuelLogs.map((f) => ({
        filled_at_km: f.filled_at_km,
        filled_at_date: f.filled_at_date,
        volume_liters: f.volume_liters,
        cost: f.cost,
        full_tank: f.full_tank === 1,
        notes: f.notes,
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
      vin: backupVehicle.vin ?? null,
      purchase_date: backupVehicle.purchase_date,
      current_km: backupVehicle.current_km,
    });

    for (const record of backupVehicle.records) {
      const item = await findMaintenanceItemByName(record.item_name);
      if (!item) continue;
      await recordMaintenanceDone({
        vehicleId: vehicle.id,
        maintenanceItemId: item.id,
        doneAtKm: record.done_at_km,
        doneAtDate: record.done_at_date,
        notes: record.notes,
        cost: record.cost,
      });
    }

    for (const doc of backupVehicle.documents ?? []) {
      await createDocument({
        vehicle_id: vehicle.id,
        document_type: doc.document_type,
        label: doc.label,
        expiry_date: doc.expiry_date,
        notes: doc.notes,
      });
    }

    for (const log of backupVehicle.fuelLogs ?? []) {
      await createFuelLog({
        vehicle_id: vehicle.id,
        filled_at_km: log.filled_at_km,
        filled_at_date: log.filled_at_date,
        volume_liters: log.volume_liters,
        cost: log.cost,
        full_tank: log.full_tank,
        notes: log.notes,
      });
    }

    await recalculateSchedules(vehicle.id);
    await notifyDueSchedules(vehicle.id);
    summary.vehiclesImported += 1;
  }

  return summary;
}
