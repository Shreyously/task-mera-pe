import { FinanceSnapshot } from "../repositories/finance.repository";
import { normalizeRupees } from "./money";

export function computeEarned(snapshot: FinanceSnapshot): {
  netMonthly: number;
  netEarnedSoFar: number;
  available: number;
} {
  const netMonthly = normalizeRupees(snapshot.grossMonthlySalary * (1 - snapshot.deductionPercent / 100));
  const netEarnedSoFar = normalizeRupees((netMonthly * snapshot.daysWorked) / snapshot.daysInMonth);
  const available = normalizeRupees(Math.max(0, netEarnedSoFar - snapshot.totalWithdrawn));

  return { netMonthly, netEarnedSoFar, available };
}