import { PoolClient } from "pg";

export type WithdrawalRecord = {
  id: number;
  userId: number;
  monthStartDate: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  idempotencyKey: string;
  failureReason: string | null;
};

const map = (r: Record<string, unknown>): WithdrawalRecord => ({
  id: Number(r.id),
  userId: Number(r.user_id),
  monthStartDate: String(r.month_start_date),
  amount: Number(r.amount),
  status: String(r.status) as "SUCCESS" | "FAILED",
  idempotencyKey: String(r.idempotency_key),
  failureReason: (r.failure_reason as string | null) ?? null
});

export async function findWithdrawalByIdempotency(c: PoolClient, userId: number, idempotencyKey: string): Promise<WithdrawalRecord | null> {
  const r = await c.query(
    "SELECT id,user_id,month_start_date,amount,status,idempotency_key,failure_reason FROM withdrawals WHERE user_id=$1 AND idempotency_key=$2 LIMIT 1",
    [userId, idempotencyKey]
  );

  return r.rows[0] ? map(r.rows[0]) : null;
}

export async function createWithdrawal(c: PoolClient, i: { userId: number; monthStartDate: string; amount: number; status: "SUCCESS" | "FAILED"; idempotencyKey: string; failureReason?: string; }): Promise<WithdrawalRecord> {
  const r = await c.query(
    "INSERT INTO withdrawals (user_id,month_start_date,amount,status,idempotency_key,failure_reason) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,user_id,month_start_date,amount,status,idempotency_key,failure_reason",
    [i.userId, i.monthStartDate, i.amount, i.status, i.idempotencyKey, i.failureReason ?? null]
  );

  return map(r.rows[0]);
}