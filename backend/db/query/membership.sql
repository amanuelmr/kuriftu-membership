-- name: ListMembershipBenefits :many
SELECT * FROM membership_benefits ORDER BY sort_order ASC, id ASC;

-- name: UpdateUserTier :one
UPDATE users
SET membership_tier = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;
