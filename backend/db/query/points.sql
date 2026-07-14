-- name: ListPointsHistory :many
SELECT * FROM points_transactions
WHERE user_id = $1
ORDER BY occurred_at DESC, id DESC;

-- name: InsertPointsTransaction :one
INSERT INTO points_transactions (user_id, description, category, txn_type, points, amount, balance_after)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: AddUserPoints :one
UPDATE users
SET points = points + $2,
    lifetime_points = lifetime_points + $2,
    updated_at = now()
WHERE id = $1
RETURNING points;

-- name: DeductUserPoints :one
-- Returns no row when the balance is insufficient, letting the caller reject
-- the redemption atomically.
UPDATE users
SET points = points - $2,
    updated_at = now()
WHERE id = $1 AND points >= $2
RETURNING points;
