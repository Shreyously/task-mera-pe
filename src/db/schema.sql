DROP TABLE IF EXISTS withdrawals;
DROP TABLE IF EXISTS user_month_ledger;
DROP TABLE IF EXISTS attendance_monthly;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  gross_monthly_salary NUMERIC(12,2) NOT NULL CHECK (gross_monthly_salary > 0),
  deduction_percent NUMERIC(5,2) NOT NULL CHECK (deduction_percent >= 0 AND deduction_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_month_ledger (
  user_id BIGINT NOT NULL REFERENCES users(id),
  month_start_date DATE NOT NULL,
  days_in_month INTEGER NOT NULL CHECK (days_in_month > 0),
  days_worked INTEGER NOT NULL CHECK (days_worked >= 0),
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  withdrawal_count INTEGER NOT NULL DEFAULT 0 CHECK (withdrawal_count >= 0),
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, month_start_date)
);

CREATE TABLE withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  month_start_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  failure_reason TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_withdrawals_user_month ON withdrawals (user_id, month_start_date);