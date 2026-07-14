-- name: ListPaymentMethods :many
SELECT * FROM payment_methods
WHERE user_id = $1
ORDER BY is_default DESC, created_at DESC;

-- name: InsertPaymentMethod :one
INSERT INTO payment_methods (user_id, brand, last_four, exp_month, exp_year, name, is_default)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ClearDefaultPaymentMethods :exec
UPDATE payment_methods SET is_default = false WHERE user_id = $1;
