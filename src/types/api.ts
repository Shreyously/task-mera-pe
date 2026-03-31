export type LimitResponse = {
  net_earned_so_far: number;
  total_withdrawn_this_month: number;
  available_limit: number;
  is_eligible_for_withdrawal: boolean;
};

export type WithdrawalRequest = {
  userId: number;
  amount: number;
};

export type WithdrawalResponse = {
  status: "SUCCESS" | "FAILED";
  userId: number;
  amount: number;
  available_limit_after: number;
  withdrawal_count_this_month: number;
  idempotency_key: string;
  replayed: boolean;
  reason?: string;
};