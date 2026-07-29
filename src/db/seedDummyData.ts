import { listBrandsByClass, listVehicleTypesByBrand } from "../repositories/catalogRepository";
import { createVehicle, listVehicles } from "../repositories/vehicleRepository";
import { recalculateSchedules, recordMaintenanceDone, snoozeSchedule } from "../repositories/scheduleRepository";
import { createDocument } from "../repositories/documentRepository";
import { createFuelLog } from "../repositories/fuelRepository";
import { createShop } from "../repositories/shopRepository";
import { setLoanForVehicle } from "../repositories/loanRepository";
import { notifyDueSchedules } from "../services/notifications";
import { getDb } from "./index";

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Adds 4 sample vehicles (3 motorcycles, 1 car) plus service history so
 * schedule status varies (overdue / due_soon / ontrack) — used for demo/dev
 * only, not production data. Only runs if the vehicles table is still empty.
 */
export async function seedDummyVehiclesIfEmpty(): Promise<void> {
  const existing = await listVehicles();
  if (existing.length > 0) return;

  const motoBrands = await listBrandsByClass("motorcycle");
  const honda = motoBrands.find((b) => b.name === "Honda");
  const yamaha = motoBrands.find((b) => b.name === "Yamaha");
  const carBrands = await listBrandsByClass("car");
  const toyota = carBrands.find((b) => b.name === "Toyota");
  if (!honda || !yamaha || !toyota) return;

  const hondaTypes = await listVehicleTypesByBrand(honda.id, "motorcycle");
  const yamahaTypes = await listVehicleTypesByBrand(yamaha.id, "motorcycle");
  const toyotaTypes = await listVehicleTypesByBrand(toyota.id, "car");

  const beat = hondaTypes.find((t) => t.name === "Beat");
  const vario = hondaTypes.find((t) => t.name === "Vario 125");
  const nmax = yamahaTypes.find((t) => t.name === "NMAX");
  const camry = toyotaTypes.find((t) => t.name === "Camry");
  if (!beat || !vario || !nmax || !camry) return;

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
  const coolantId = await findItemId("Coolant");

  const quickFix = await createShop({
    name: "QuickFix Garage",
    phone: "+1-555-0142",
    address: "123 Main St",
  });

  // Dad's Bike: engine oil overdue -> last done 4 months ago, well past the interval
  const dadsBike = await createVehicle({
    vehicle_type_id: beat.id,
    nickname: "Dad's Bike",
    plate_number: "ABC-1234",
    current_km: 15230,
    purchase_date: daysAgo(900),
  });
  if (engineOilId) {
    await recordMaintenanceDone({
      vehicleId: dadsBike.id,
      maintenanceItemId: engineOilId,
      doneAtKm: 13000,
      doneAtDate: daysAgo(120),
      cost: 8.5,
    });
  }
  if (sparkPlugId) {
    await recordMaintenanceDone({
      vehicleId: dadsBike.id,
      maintenanceItemId: sparkPlugId,
      doneAtKm: 14800,
      doneAtDate: daysAgo(20),
      notes: "New NGK plug",
      cost: 6,
      shopId: quickFix.id,
    });
  }
  await createDocument({
    vehicle_id: dadsBike.id,
    document_type: "insurance",
    label: "Insurance",
    expiry_date: daysFromNow(10),
  });
  await createFuelLog({
    vehicle_id: dadsBike.id,
    filled_at_km: 15100,
    filled_at_date: daysAgo(2),
    volume_liters: 4.2,
    cost: 5.6,
    full_tank: true,
  });
  await createFuelLog({
    vehicle_id: dadsBike.id,
    filled_at_km: 14780,
    filled_at_date: daysAgo(9),
    volume_liters: 4.1,
    cost: 5.5,
    full_tank: true,
  });

  // Mom's Scooter: regular servicing, everything on track
  const momsScooter = await createVehicle({
    vehicle_type_id: vario.id,
    nickname: "Mom's Scooter",
    plate_number: "XYZ-5678",
    current_km: 8500,
    purchase_date: daysAgo(400),
  });
  if (engineOilId) {
    await recordMaintenanceDone({
      vehicleId: momsScooter.id,
      maintenanceItemId: engineOilId,
      doneAtKm: 8300,
      doneAtDate: daysAgo(5),
      cost: 7,
    });
  }
  await createDocument({
    vehicle_id: momsScooter.id,
    document_type: "tax",
    label: "Annual Tax",
    expiry_date: daysFromNow(200),
  });

  // Alex's NMAX: approaching the limit (due_soon) for the CVT drive belt
  const alexsNmax = await createVehicle({
    vehicle_type_id: nmax.id,
    nickname: "Alex's NMAX",
    plate_number: "DEF-9012",
    current_km: 23800,
    purchase_date: daysAgo(700),
  });
  if (cvtBeltId) {
    await recordMaintenanceDone({
      vehicleId: alexsNmax.id,
      maintenanceItemId: cvtBeltId,
      doneAtKm: 0,
      doneAtDate: daysAgo(650),
    });
  }
  if (engineOilId) {
    await recordMaintenanceDone({
      vehicleId: alexsNmax.id,
      maintenanceItemId: engineOilId,
      doneAtKm: 23700,
      doneAtDate: daysAgo(3),
    });
  }

  // Family Car: a Toyota Camry, showing car-specific items and an Inspection reminder
  const familyCar = await createVehicle({
    vehicle_type_id: camry.id,
    nickname: "Family Car",
    plate_number: "XYZ-7890",
    vin: "4T1BF1FK5CU123456",
    current_km: 62000,
    purchase_date: daysAgo(1200),
  });
  if (engineOilId) {
    await recordMaintenanceDone({
      vehicleId: familyCar.id,
      maintenanceItemId: engineOilId,
      doneAtKm: 60000,
      doneAtDate: daysAgo(150),
      cost: 65,
    });
  }
  if (coolantId) {
    await recordMaintenanceDone({
      vehicleId: familyCar.id,
      maintenanceItemId: coolantId,
      doneAtKm: 0,
      doneAtDate: daysAgo(1150),
    });
  }
  await createDocument({
    vehicle_id: familyCar.id,
    document_type: "inspection",
    label: "State Inspection",
    expiry_date: daysFromNow(12),
  });
  await createFuelLog({
    vehicle_id: familyCar.id,
    filled_at_km: 61850,
    filled_at_date: daysAgo(3),
    volume_liters: 45,
    cost: 52,
    full_tank: true,
  });
  await createFuelLog({
    vehicle_id: familyCar.id,
    filled_at_km: 61420,
    filled_at_date: daysAgo(10),
    volume_liters: 43,
    cost: 50,
    full_tank: true,
  });
  await setLoanForVehicle(familyCar.id, {
    lender: "Toyota Financial",
    monthly_payment: 410,
    start_date: daysAgo(365),
    term_months: 60,
  });

  await recalculateSchedules(dadsBike.id);
  await recalculateSchedules(momsScooter.id);
  await recalculateSchedules(alexsNmax.id);
  await recalculateSchedules(familyCar.id);

  // Demonstrate snoozing: Alex's NMAX CVT belt is due_soon, hide its
  // notification for a week without actually doing the service.
  if (cvtBeltId) {
    const belt = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM maintenance_schedules WHERE vehicle_id = ? AND maintenance_item_id = ?",
      alexsNmax.id,
      cvtBeltId
    );
    if (belt) await snoozeSchedule(belt.id, daysFromNow(7));
  }

  await notifyDueSchedules(dadsBike.id);
  await notifyDueSchedules(momsScooter.id);
  await notifyDueSchedules(alexsNmax.id);
  await notifyDueSchedules(familyCar.id);
}
