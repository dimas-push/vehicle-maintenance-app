import type { ScheduleStatus } from "../types/models";

const DUE_SOON_KM_THRESHOLD = 300;
const DUE_SOON_DAYS_THRESHOLD = 14;

export interface DueEstimateInput {
  intervalKm: number | null;
  intervalMonths: number | null;
  lastDoneKm: number | null;
  lastDoneDate: string | null; // ISO date
  currentKm: number;
  currentDate: Date;
}

export interface DueEstimate {
  dueKm: number | null;
  dueDate: string | null; // ISO date
  status: ScheduleStatus;
}

/**
 * Computes the km/date the next maintenance is due, then derives its status.
 * When an item has both a km interval AND a month interval (e.g. engine oil),
 * whichever is reached first determines the status.
 */
export function estimateNextDue(input: DueEstimateInput): DueEstimate {
  const { intervalKm, intervalMonths, lastDoneKm, lastDoneDate, currentKm, currentDate } = input;

  const dueKm = intervalKm != null ? (lastDoneKm ?? 0) + intervalKm : null;

  let dueDate: string | null = null;
  if (intervalMonths != null) {
    const base = lastDoneDate ? new Date(lastDoneDate) : currentDate;
    const due = new Date(base);
    due.setMonth(due.getMonth() + intervalMonths);
    dueDate = due.toISOString().slice(0, 10);
  }

  const kmStatus = dueKm != null ? statusFromKm(dueKm, currentKm) : null;
  const dateStatus = dueDate != null ? statusFromDate(dueDate, currentDate) : null;

  const status = worstStatus([kmStatus, dateStatus]);

  return { dueKm, dueDate, status };
}

function statusFromKm(dueKm: number, currentKm: number): ScheduleStatus {
  const remaining = dueKm - currentKm;
  if (remaining <= 0) return "overdue";
  if (remaining <= DUE_SOON_KM_THRESHOLD) return "due_soon";
  return "ontrack";
}

function statusFromDate(dueDateIso: string, currentDate: Date): ScheduleStatus {
  const due = new Date(dueDateIso);
  const diffDays = Math.floor((due.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "overdue";
  if (diffDays <= DUE_SOON_DAYS_THRESHOLD) return "due_soon";
  return "ontrack";
}

const STATUS_SEVERITY: Record<ScheduleStatus, number> = {
  ontrack: 0,
  due_soon: 1,
  overdue: 2,
};

function worstStatus(statuses: (ScheduleStatus | null)[]): ScheduleStatus {
  let worst: ScheduleStatus = "ontrack";
  for (const s of statuses) {
    if (s && STATUS_SEVERITY[s] > STATUS_SEVERITY[worst]) worst = s;
  }
  return worst;
}
