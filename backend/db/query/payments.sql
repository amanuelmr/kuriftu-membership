-- name: ListPayments :many
SELECT * FROM payments
WHERE user_id = $1
ORDER BY occurred_at DESC;

-- name: InsertPayment :one
INSERT INTO payments (user_id, tx_ref, description, amount, currency, status, payment_method, checkout_url, purpose, target_tier)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetPaymentByTxRef :one
SELECT * FROM payments WHERE tx_ref = $1;

-- name: UpdatePaymentStatus :one
UPDATE payments
SET status = $2
WHERE tx_ref = $1
RETURNING *;
