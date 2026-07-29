import { colors } from "../theme";
import type { ScheduleStatus } from "../types/models";

export const STATUS_SEVERITY: Record<ScheduleStatus, number> = { ontrack: 0, due_soon: 1, overdue: 2 };

export const STATUS_LABEL: Record<ScheduleStatus, string> = {
  ontrack: "On Track",
  due_soon: "Due Soon",
  overdue: "Overdue",
};

export const STATUS_STYLE: Record<ScheduleStatus, { fg: string; bg: string }> = {
  ontrack: { fg: colors.success, bg: colors.successSoft },
  due_soon: { fg: colors.warning, bg: colors.warningSoft },
  overdue: { fg: colors.danger, bg: colors.dangerSoft },
};

export function worstStatus(statuses: ScheduleStatus[]): ScheduleStatus | null {
  if (statuses.length === 0) return null;
  return statuses.reduce<ScheduleStatus>(
    (worst, s) => (STATUS_SEVERITY[s] > STATUS_SEVERITY[worst] ? s : worst),
    "ontrack"
  );
}
