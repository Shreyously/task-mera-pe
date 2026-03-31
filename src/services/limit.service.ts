import { pool } from "../db/pool";
import { getFinanceSnapshot } from "../repositories/finance.repository";
import { LimitResponse } from "../types/api";
import { AppError } from "../utils/app-error";
import { computeEarned } from "../utils/calculator";

export async function calculateAvailableLimit(userId: number): Promise<LimitResponse> {
  const client = await pool.connect();

  try {
    const snapshot = await getFinanceSnapshot(client, userId);

    if (!snapshot) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found for current month data");
    }

    const { netEarnedSoFar, available } = computeEarned(snapshot);

    return {
      net_earned_so_far: netEarnedSoFar,
      total_withdrawn_this_month: snapshot.totalWithdrawn,
      available_limit: available,
      is_eligible_for_withdrawal: snapshot.withdrawalCount < 3 && available > 0
    };
  } finally {
    client.release();
  }
}