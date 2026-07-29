import type { ScheduleStatus } from "../types/models";

/** Pure date-based status — same day threshold as maintenance schedules, no km component. */
export function statusFromExpiry(expiryDateIso: string, daysThreshold: number, now = new Date()): ScheduleStatus {
  const expiry = new Date(expiryDateIso);
  const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "overdue";
  if (diffDays <= daysThreshold) return "due_soon";
  return "ontrack";
}

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  tax: "Tax",
  insurance: "Insurance",
  registration: "Registration",
  other: "Other",
};
