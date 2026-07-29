import { getDb } from "../db";
import type { DocumentType, VehicleDocument } from "../types/models";

export interface NewDocumentInput {
  vehicle_id: number;
  document_type: DocumentType;
  label: string;
  expiry_date: string;
  notes?: string | null;
}

export async function listDocumentsForVehicle(vehicleId: number): Promise<VehicleDocument[]> {
  const db = await getDb();
  return db.getAllAsync<VehicleDocument>(
    "SELECT * FROM vehicle_documents WHERE vehicle_id = ? ORDER BY expiry_date ASC",
    vehicleId
  );
}

export async function createDocument(input: NewDocumentInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO vehicle_documents (vehicle_id, document_type, label, expiry_date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    input.vehicle_id,
    input.document_type,
    input.label,
    input.expiry_date,
    input.notes ?? null
  );
}

export async function updateDocumentExpiry(documentId: number, expiryDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE vehicle_documents SET expiry_date = ? WHERE id = ?", expiryDate, documentId);
}

export async function deleteDocument(documentId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vehicle_documents WHERE id = ?", documentId);
}
