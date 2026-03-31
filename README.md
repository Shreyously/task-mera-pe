Mera-Pe Task API

Express + TypeScript + PostgreSQL backend for earned wage limit and concurrency-safe withdrawals.

Setup
1. Copy .env.example to .env
2. Set DATABASE_URL
3. npm install
4. npm run db:schema
5. npm run db:seed
6. npm run dev

Endpoints
GET /api/limit/:userId
POST /api/withdraw with Idempotency-Key header

Task 3: Orphaned Payout Architecture Proposal

<div align="center">
  <img src="/images/img_1.png" alt="img_1" />
</div>

To handle a missed Razorpay webhook, payouts are modeled as a state machine in our database: CREATED -> SUBMITTED_TO_RAZORPAY -> PENDING_CONFIRMATION -> SUCCESS / FAILED. When we call RazorpayX, we immediately save the payout_id and reference_id Razorpay returns, and mark the withdrawal as PENDING_CONFIRMATION. If our server crashes and misses the webhook, a scheduled recovery worker runs every 2-5 minutes, finds any payouts stuck in PENDING_CONFIRMATION beyond a safe threshold, and polls Razorpay payout status API directly to get the real outcome. This means webhook delivery improves speed, but is never the single source of truth.

<div align="center">
  <img src="/images/img2.png" alt="img_2" />
</div>

For reconciliation, a periodic job (hourly or daily) pulls Razorpay payout reports and compares them against our internal ledger using payout_id, reference_id, and amount. Any mismatch (Razorpay shows success but our ledger does not, amount difference, or duplicate) is written to a reconciliation queue. Safe mismatches are auto-corrected; risky ones are sent for manual finance review. This guarantees internal ledger convergence to Razorpay reality, even when webhooks are delayed or missed.