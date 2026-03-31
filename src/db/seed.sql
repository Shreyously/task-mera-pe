WITH current_month AS (
  SELECT DATE_TRUNC('month', (NOW() AT TIME ZONE 'Asia/Kolkata'))::DATE AS month_start
),
upsert_user AS (
  INSERT INTO users (id, gross_monthly_salary, deduction_percent)
  VALUES (1, 60000, 10)
  ON CONFLICT (id) DO UPDATE
  SET gross_monthly_salary = EXCLUDED.gross_monthly_salary,
      deduction_percent = EXCLUDED.deduction_percent,
      updated_at = NOW()
  RETURNING id
),
upsert_ledger AS (
  INSERT INTO user_month_ledger (user_id, month_start_date, days_in_month, days_worked, total_withdrawn, withdrawal_count, version)
  SELECT 1, month_start, 30, 15, 7000, 2, 0
  FROM current_month
  ON CONFLICT (user_id, month_start_date) DO UPDATE
  SET days_in_month = EXCLUDED.days_in_month,
      days_worked = EXCLUDED.days_worked,
      total_withdrawn = EXCLUDED.total_withdrawn,
      withdrawal_count = EXCLUDED.withdrawal_count,
      updated_at = NOW()
  RETURNING user_id
)
INSERT INTO withdrawals (user_id, month_start_date, amount, status, idempotency_key, created_at)
SELECT 1, c.month_start, v.amount, 'SUCCESS', v.idempotency_key, c.month_start + v.day_offset
FROM current_month c
CROSS JOIN (
  VALUES
    (5000::NUMERIC(12,2), 'seed-withdrawal-5', INTERVAL '4 days'),
    (2000::NUMERIC(12,2), 'seed-withdrawal-10', INTERVAL '9 days')
) AS v(amount, idempotency_key, day_offset)
ON CONFLICT (user_id, idempotency_key) DO NOTHING;