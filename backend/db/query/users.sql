-- name: CreateUser :one
INSERT INTO users (first_name, last_name, email, phone, password_hash, membership_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: UpdateUser :one
UPDATE users
SET first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name  = COALESCE(sqlc.narg('last_name'), last_name),
    phone      = COALESCE(sqlc.narg('phone'), phone),
    avatar     = COALESCE(sqlc.narg('avatar'), avatar),
    updated_at = now()
WHERE id = sqlc.arg('id')
RETURNING *;
