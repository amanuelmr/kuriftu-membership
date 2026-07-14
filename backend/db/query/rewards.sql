-- name: ListRewards :many
SELECT * FROM rewards
WHERE sqlc.narg('category')::text IS NULL OR category = sqlc.narg('category')::text
ORDER BY points_required ASC;

-- name: GetReward :one
SELECT * FROM rewards WHERE id = $1;

-- name: InsertRedemption :one
INSERT INTO redemptions (user_id, reward_id, points_spent)
VALUES ($1, $2, $3)
RETURNING *;
