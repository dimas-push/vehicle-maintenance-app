import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { getVehicle } from "../repositories/vehicleRepository";
import { getVehicleTypeWithBrandName } from "../repositories/catalogRepository";
import { listMaintenanceRecords } from "../repositories/scheduleRepository";
import { listFuelLogs } from "../repositories/fuelRepository";
import { listDocumentsForVehicle } from "../repositories/documentRepository";
import { formatDistance, formatVolume, type DistanceUnit, type VolumeUnit } from "../utils/units";
import { DOCUMENT_TYPE_LABEL } from "../utils/documentStatus";

function csvEscape(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function reportFileBaseName(vehicleId: number): Promise<string> {
  const vehicle = await getVehicle(vehicleId);
  const stamp = new Date().toISOString().slice(0, 10);
  const safeName = (vehicle?.nickname ?? "vehicle").replace(/[^a-z0-9]+/gi, "-");
  return `${safeName}-report-${stamp}`;
}

async function shareOrDownload(content: string, mimeType: string, fileName: string): Promise<void> {
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType });
  } else {
    throw new Error("Sharing isn't available on this device.");
  }
}

export async function exportServiceReportCsv(vehicleId: number): Promise<void> {
  const records = await listMaintenanceRecords(vehicleId);
  const rows = [
    ["Date", "Item", "Odometer (km)", "Cost", "Notes"],
    ...records.map((r) => [r.done_at_date, r.item_name, String(r.done_at_km), r.cost != null ? String(r.cost) : "", r.notes ?? ""]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  const fileName = `${await reportFileBaseName(vehicleId)}.csv`;
  await shareOrDownload(csv, "text/csv", fileName);
}

export async function exportServiceReportPdf(
  vehicleId: number,
  unit: DistanceUnit,
  volumeUnit: VolumeUnit
): Promise<void> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error("Vehicle not found");

  const [typeInfo, records, fuelLogs, documents] = await Promise.all([
    getVehicleTypeWithBrandName(vehicle.vehicle_type_id),
    listMaintenanceRecords(vehicleId),
    listFuelLogs(vehicleId),
    listDocumentsForVehicle(vehicleId),
  ]);

  const recordRows = records
    .map(
      (r) => `<tr>
        <td>${r.done_at_date}</td>
        <td>${r.item_name}</td>
        <td>${formatDistance(r.done_at_km, unit)}</td>
        <td>${r.cost != null ? r.cost.toFixed(2) : "—"}</td>
        <td>${r.notes ?? ""}</td>
      </tr>`
    )
    .join("");

  const fuelRows = fuelLogs
    .map(
      (f) => `<tr>
        <td>${f.filled_at_date}</td>
        <td>${formatDistance(f.filled_at_km, unit)}</td>
        <td>${formatVolume(f.volume_liters, volumeUnit)}</td>
        <td>${f.cost != null ? f.cost.toFixed(2) : "—"}</td>
        <td>${f.full_tank ? "Full" : "Partial"}</td>
      </tr>`
    )
    .join("");

  const documentRows = documents
    .map(
      (d) => `<tr>
        <td>${DOCUMENT_TYPE_LABEL[d.document_type]}</td>
        <td>${d.label}</td>
        <td>${d.expiry_date}</td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin-bottom: 0; }
          .subtitle { color: #64748b; margin-top: 4px; }
          h2 { margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { color: #64748b; font-weight: 600; }
          .empty { color: #94a3b8; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>${vehicle.nickname}</h1>
        <div class="subtitle">
          ${typeInfo ? `${typeInfo.brandName} ${typeInfo.typeName}` : ""}
          ${vehicle.plate_number ? ` • ${vehicle.plate_number}` : ""}
          ${vehicle.vin ? ` • VIN ${vehicle.vin}` : ""}
        </div>
        <div class="subtitle">Current odometer: ${formatDistance(vehicle.current_km, unit)}</div>
        <div class="subtitle">Report generated ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</div>

        <h2>Service History</h2>
        ${records.length === 0 ? '<p class="empty">No service records.</p>' : `
          <table>
            <tr><th>Date</th><th>Item</th><th>Odometer</th><th>Cost</th><th>Notes</th></tr>
            ${recordRows}
          </table>`}

        <h2>Fuel Log</h2>
        ${fuelLogs.length === 0 ? '<p class="empty">No fuel entries.</p>' : `
          <table>
            <tr><th>Date</th><th>Odometer</th><th>Volume</th><th>Cost</th><th>Type</th></tr>
            ${fuelRows}
          </table>`}

        <h2>Documents</h2>
        ${documents.length === 0 ? '<p class="empty">No document reminders.</p>' : `
          <table>
            <tr><th>Type</th><th>Label</th><th>Expiry</th></tr>
            ${documentRows}
          </table>`}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === "web") return; // web already opened its own print dialog

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
  } else {
    throw new Error("Sharing isn't available on this device.");
  }
}
