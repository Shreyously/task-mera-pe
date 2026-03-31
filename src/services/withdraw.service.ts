import { pool } from "../db/pool";
import { getFinanceSnapshot, getFinanceSnapshotForUpdate, incrementLedger } from "../repositories/finance.repository";
import { createWithdrawal, findWithdrawalByIdempotency, WithdrawalRecord } from "../repositories/withdrawal.repository";
import { WithdrawalResponse } from "../types/api";
import { AppError } from "../utils/app-error";
import { computeEarned } from "../utils/calculator";
import { normalizeRupees } from "../utils/money";

function toResponse(record: WithdrawalRecord, availableAfter: number, count: number, replayed: boolean): WithdrawalResponse {
  return {
    status: record.status,
    userId: record.userId,
    amount: normalizeRupees(record.amount),
    available_limit_after: normalizeRupees(availableAfter),
    withdrawal_count_this_month: count,
    idempotency_key: record.idempotencyKey,
    replayed,
    reason: record.failureReason ?? undefined
  };
}

export async function processWithdrawal(input: { userId: number; amountRupees: number; idempotencyKey: string }): Promise<WithdrawalResponse> {
  const amount = normalizeRupees(input.amountRupees);
  if (amount <= 0) {
    throw new AppError(400, "INVALID_AMOUNT", "Withdrawal amount must be greater than zero");
  }

  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const firstReplay = await findWithdrawalByIdempotency(client, input.userId, input.idempotencyKey);
    if (firstReplay) {
      const snap = await getFinanceSnapshotForUpdate(client, input.userId);
      if (!snap) {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
      const earned = computeEarned(snap);
      await client.query("COMMIT");
      transactionOpen = false;
      return toResponse(firstReplay, earned.available, snap.withdrawalCount, true);
    }

    const snap = await getFinanceSnapshotForUpdate(client, input.userId);
    if (!snap) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const secondReplay = await findWithdrawalByIdempotency(client, input.userId, input.idempotencyKey);
    if (secondReplay) {
      const earned = computeEarned(snap);
      await client.query("COMMIT");
      transactionOpen = false;
      return toResponse(secondReplay, earned.available, snap.withdrawalCount, true);
    }

    const earned = computeEarned(snap);

    if (snap.withdrawalCount >= 3) {
      const failed = await createWithdrawal(client, {
        userId: input.userId,
        monthStartDate: snap.monthStartDate,
        amount,
        status: "FAILED",
        idempotencyKey: input.idempotencyKey,
        failureReason: "MONTHLY_WITHDRAWAL_LIMIT_REACHED"
      });
      await client.query("COMMIT");
      transactionOpen = false;
      return toResponse(failed, earned.available, snap.withdrawalCount, false);
    }

    if (amount > earned.available) {
      const failed = await createWithdrawal(client, {
        userId: input.userId,
        monthStartDate: snap.monthStartDate,
        amount,
        status: "FAILED",
        idempotencyKey: input.idempotencyKey,
        failureReason: "INSUFFICIENT_AVAILABLE_LIMIT"
      });
      await client.query("COMMIT");
      transactionOpen = false;
      return toResponse(failed, earned.available, snap.withdrawalCount, false);
    }

    const success = await createWithdrawal(client, {
      userId: input.userId,
      monthStartDate: snap.monthStartDate,
      amount,
      status: "SUCCESS",
      idempotencyKey: input.idempotencyKey
    });

    const ledger = await incrementLedger(client, {
      userId: input.userId,
      monthStartDate: snap.monthStartDate,
      amount
    });

    await client.query("COMMIT");
    transactionOpen = false;

    const availableAfter = normalizeRupees(Math.max(0, earned.available - amount));
    return toResponse(success, availableAfter, ledger.withdrawalCount, false);
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }

    const code = (error as { code?: string }).code;
    if (code === "23505") {
      const existing = await findWithdrawalByIdempotency(client, input.userId, input.idempotencyKey);
      if (existing) {
        const snap = await getFinanceSnapshot(client, input.userId);
        if (!snap) {
          throw new AppError(404, "USER_NOT_FOUND", "User not found");
        }
        const earned = computeEarned(snap);
        return toResponse(existing, earned.available, snap.withdrawalCount, true);
      }
      throw new AppError(409, "IDEMPOTENCY_CONFLICT", "Duplicate idempotency key conflict");
    }

    throw error;
  } finally {
    client.release();
  }
}
