import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import {
  findMaintenanceItemByName,
  findVehicleTypeByNames,
  getVehicleTypeWithBrandName,
} from "../repositories/catalogRepository";
import { createVehicle, listVehicles, updateVehicleDetails } from "../repositories/vehicleRepository";
import {
  listMaintenanceRecords,
  recalculateSchedules,
  recordMaintenanceDone,
} from "../repositories/scheduleRepository";
import { createDocument, listDocumentsForVehicle } from "../repositories/documentRepository";
import { createFuelLog, listFuelLogs } from "../repositories/fuelRepository";
import { findOrCreateShopByName } from "../repositories/shopRepository";
import { getLoanForVehicle, setLoanForVehicle } from "../repositories/loanRepository";
import { createExpense, listExpensesForVehicle } from "../repositories/expenseRepository";
import { getOwnerProfile, isOwnerProfileEmpty, setOwnerProfile, type OwnerProfile } from "../utils/ownerProfile";
import type { DocumentType, ExpenseCategory, FuelType, Transmission } from "../types/models";
import { notifyDueSchedules } from "./notifications";

// Every field beyond the vehicle's core identity (records, documents,
// fuelLogs, expenses, loan, year/color/engine_size/transmission/fuel_type)
// is optional on read, so a backup produced by an older/newer version of
// this format still imports without crashing — bump this whenever the
// shape changes so a stale local install knows to treat old exports
// leniently rather than assume every field is present.
const BACKUP_FORMAT_VERSION = 6;

interface BackupRecord {
  item_name: string;
  done_at_km: number;
  done_at_date: string;
  cost: number | null;
  notes: string | null;
  shop_name?: string | null;
}

interface BackupLoan {
  lender: string | null;
  monthly_payment: number;
  start_date: string;
  term_months: number;
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

interface BackupExpense {
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
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
  expenses?: BackupExpense[];
  loan?: BackupLoan | null;
  year?: number | null;
  color?: string | null;
  engine_size?: string | null;
  transmission?: Transmission | null;
  fuel_type?: FuelType | null;
}

export interface BackupFile {
  formatVersion: number;
  exportedAt: string;
  vehicles: BackupVehicle[];
  ownerProfile?: OwnerProfile | null;
}

export async function buildBackupData(): Promise<BackupFile> {
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
    const expenses = await listExpensesForVehicle(vehicle.id);
    const loan = await getLoanForVehicle(vehicle.id);

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
        shop_name: r.shop_name,
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
      expenses: expenses.map((e) => ({
        category: e.category,
        amount: e.amount,
        expense_date: e.expense_date,
        notes: e.notes,
      })),
      loan: loan
        ? {
            lender: loan.lender,
            monthly_payment: loan.monthly_payment,
            start_date: loan.start_date,
            term_months: loan.term_months,
          }
        : null,
      year: vehicle.year,
      color: vehicle.color,
      engine_size: vehicle.engine_size,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
    });
  }

  const ownerProfile = await getOwnerProfile();

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    vehicles: backupVehicles,
    ownerProfile: isOwnerProfileEmpty(ownerProfile) ? null : ownerProfile,
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

/** Parses raw backup JSON text into a validated BackupFile, or throws a user-facing error. */
export function parseBackupJson(text: string): BackupFile {
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid backup data (couldn't parse JSON).");
  }
  if (!Array.isArray(data.vehicles)) {
    throw new Error("This file isn't valid backup data (missing vehicles list).");
  }
  return data;
}

/** Applies a parsed backup — used by both the local file import and cloud restore flows. */
export async function applyBackupData(data: BackupFile): Promise<ImportSummary> {
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

    await updateVehicleDetails(vehicle.id, {
      nickname: backupVehicle.nickname,
      plate_number: backupVehicle.plate_number,
      vin: backupVehicle.vin ?? null,
      year: backupVehicle.year ?? null,
      color: backupVehicle.color ?? null,
      engine_size: backupVehicle.engine_size ?? null,
      transmission: backupVehicle.transmission ?? null,
      fuel_type: backupVehicle.fuel_type ?? null,
    });

    for (const record of backupVehicle.records) {
      const item = await findMaintenanceItemByName(record.item_name);
      if (!item) continue;
      const shop = record.shop_name ? await findOrCreateShopByName(record.shop_name) : null;
      await recordMaintenanceDone({
        vehicleId: vehicle.id,
        maintenanceItemId: item.id,
        doneAtKm: record.done_at_km,
        doneAtDate: record.done_at_date,
        notes: record.notes,
        cost: record.cost,
        shopId: shop?.id ?? null,
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

    for (const expense of backupVehicle.expenses ?? []) {
      await createExpense({
        vehicle_id: vehicle.id,
        category: expense.category,
        amount: expense.amount,
        expense_date: expense.expense_date,
        notes: expense.notes,
      });
    }

    if (backupVehicle.loan) {
      await setLoanForVehicle(vehicle.id, {
        lender: backupVehicle.loan.lender,
        monthly_payment: backupVehicle.loan.monthly_payment,
        start_date: backupVehicle.loan.start_date,
        term_months: backupVehicle.loan.term_months,
      });
    }

    await recalculateSchedules(vehicle.id);
    await notifyDueSchedules(vehicle.id);
    summary.vehiclesImported += 1;
  }

  if (data.ownerProfile) {
    await setOwnerProfile(data.ownerProfile);
  }

  return summary;
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

  return applyBackupData(parseBackupJson(text));
}
