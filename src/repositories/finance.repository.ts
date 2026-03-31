import { PoolClient } from "pg";

export type FinanceSnapshot = {
  userId: number;
  grossMonthlySalary: number;
  deductionPercent: number;
  daysInMonth: number;
  daysWorked: number;
  totalWithdrawn: number;
  withdrawalCount: number;
  monthStartDate: string;
};

const Q = "SELECT u.id user_id,u.gross_monthly_salary,u.deduction_percent,l.days_in_month,l.days_worked,l.total_withdrawn,l.withdrawal_count,l.month_start_date FROM users u JOIN user_month_ledger l ON l.user_id=u.id AND l.month_start_date=DATE_TRUNC('month',(NOW() AT TIME ZONE 'Asia/Kolkata'))::DATE WHERE u.id=$1";

const map = (r: Record<string, unknown>): FinanceSnapshot => ({
  userId: Number(r.user_id),
  grossMonthlySalary: Number(r.gross_monthly_salary),
  deductionPercent: Number(r.deduction_percent),
  daysInMonth: Number(r.days_in_month),
  daysWorked: Number(r.days_worked),
  totalWithdrawn: Number(r.total_withdrawn),
  withdrawalCount: Number(r.withdrawal_count),
  monthStartDate: String(r.month_start_date)
});

export async function getFinanceSnapshot(c: PoolClient, userId: number): Promise<FinanceSnapshot | null> {
  const r = await c.query(Q, [userId]);
  return r.rows[0] ? map(r.rows[0]) : null;
}

export async function getFinanceSnapshotForUpdate(c: PoolClient, userId: number): Promise<FinanceSnapshot | null> {
  const r = await c.query(Q + " FOR UPDATE OF l", [userId]);
  return r.rows[0] ? map(r.rows[0]) : null;
}

export async function incrementLedger(
  c: PoolClient,
  i: { userId: number; monthStartDate: string; amount: number }
): Promise<{ totalWithdrawn: number; withdrawalCount: number }> {
  const r = await c.query(
    "UPDATE user_month_ledger SET total_withdrawn=total_withdrawn+$3,withdrawal_count=withdrawal_count+1,version=version+1,updated_at=NOW() WHERE user_id=$1 AND month_start_date=$2 RETURNING total_withdrawn,withdrawal_count",
    [i.userId, i.monthStartDate, i.amount]
  );

  return {
    totalWithdrawn: Number(r.rows[0].total_withdrawn),
    withdrawalCount: Number(r.rows[0].withdrawal_count)
  };
}
