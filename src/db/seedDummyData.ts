import { listBrands, listVehicleTypesByBrand } from "../repositories/catalogRepository";
import { createVehicle, listVehicles } from "../repositories/vehicleRepository";
import { recalculateSchedules, recordMaintenanceDone } from "../repositories/scheduleRepository";
import { notifyDueSchedules } from "../services/notifications";
import { getDb } from "./index";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Adds 3 sample vehicles plus service history so schedule status varies
 * (overdue / due_soon / ontrack) — used for demo/dev only, not production
 * data. Only runs if the vehicles table is still empty.
 */
export async function seedDummyVehiclesIfEmpty(): Promise<void> {
  const existing = await listVehicles();
  if (existing.length > 0) return;

  const brands = await listBrands();
  const honda = brands.find((b) => b.name === "Honda");
  const yamaha = brands.find((b) => b.name === "Yamaha");
  if (!honda || !yamaha) return;

  const hondaTypes = await listVehicleTypesByBrand(honda.id);
  const yamahaTypes = await listVehicleTypesByBrand(yamaha.id);

  const beat = hondaTypes.find((t) => t.name === "Beat");
  const vario = hondaTypes.find((t) => t.name === "Vario 125");
  const nmax = yamahaTypes.find((t) => t.name === "NMAX");
  if (!beat || !vario || !nmax) return;

  const db = await getDb();

  const findItemId = async (name: string) => {
    const row = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM maintenance_items WHERE name = ?",
      name
    );
    return row?.id ?? null;
  };

  const engineOilId = await findItemId("Engine oil");
  const sparkPlugId = await findItemId("Spark plug");
  const cvtBeltId = await findItemId("CVT drive belt");

  // Dad's Bike: engine oil overdue -> last done 4 months ago, well past the interval
  const dadsBike = await createVehicle({
    vehicle_type_id: beat.id,
    nickname: "Dad's Bike",
    plate_number: "ABC-1234",
    current_km: 15230,
    purchase_date: daysAgo(900),
  });
  if (engineOilId) {
    await recordMaintenanceDone(dadsBike.id, engineOilId, 13000, daysAgo(120));
  }
  if (sparkPlugId) {
    await recordMaintenanceDone(dadsBike.id, sparkPlugId, 14800, daysAgo(20));
  }

  // Mom's Scooter: regular servicing, everything on track
  const momsScooter = await createVehicle({
    vehicle_type_id: vario.id,
    nickname: "Mom's Scooter",
    plate_number: "XYZ-5678",
    current_km: 8500,
    purchase_date: daysAgo(400),
  });
  if (engineOilId) {
    await recordMaintenanceDone(momsScooter.id, engineOilId, 8300, daysAgo(5));
  }

  // Alex's NMAX: approaching the limit (due_soon) for the CVT drive belt
  const alexsNmax = await createVehicle({
    vehicle_type_id: nmax.id,
    nickname: "Alex's NMAX",
    plate_number: "DEF-9012",
    current_km: 23800,
    purchase_date: daysAgo(700),
  });
  if (cvtBeltId) {
    await recordMaintenanceDone(alexsNmax.id, cvtBeltId, 0, daysAgo(650));
  }
  if (engineOilId) {
    await recordMaintenanceDone(alexsNmax.id, engineOilId, 23700, daysAgo(3));
  }

  await recalculateSchedules(dadsBike.id);
  await recalculateSchedules(momsScooter.id);
  await recalculateSchedules(alexsNmax.id);

  await notifyDueSchedules(dadsBike.id);
  await notifyDueSchedules(momsScooter.id);
  await notifyDueSchedules(alexsNmax.id);
}
