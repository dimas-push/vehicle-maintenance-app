import { getDb } from "../db";
import type { ServiceShop } from "../types/models";

export interface ShopInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function listShops(): Promise<ServiceShop[]> {
  const db = await getDb();
  return db.getAllAsync<ServiceShop>("SELECT * FROM service_shops ORDER BY name");
}

export async function createShop(input: ShopInput): Promise<ServiceShop> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO service_shops (name, phone, address, notes) VALUES (?, ?, ?, ?)",
    input.name.trim(),
    input.phone?.trim() || null,
    input.address?.trim() || null,
    input.notes?.trim() || null
  );
  return {
    id: result.lastInsertRowId,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function updateShop(shopId: number, input: ShopInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE service_shops SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?",
    input.name.trim(),
    input.phone?.trim() || null,
    input.address?.trim() || null,
    input.notes?.trim() || null,
    shopId
  );
}

export async function deleteShop(shopId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM service_shops WHERE id = ?", shopId);
}

export async function getShop(shopId: number): Promise<ServiceShop | null> {
  const db = await getDb();
  return db.getFirstAsync<ServiceShop>("SELECT * FROM service_shops WHERE id = ?", shopId);
}

export async function findOrCreateShopByName(name: string): Promise<ServiceShop> {
  const db = await getDb();
  const trimmed = name.trim();
  const existing = await db.getFirstAsync<ServiceShop>(
    "SELECT * FROM service_shops WHERE name = ? COLLATE NOCASE",
    trimmed
  );
  if (existing) return existing;
  return createShop({ name: trimmed });
}
