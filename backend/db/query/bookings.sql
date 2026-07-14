-- name: ListBookings :many
SELECT * FROM bookings
WHERE user_id = $1
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status')::text)
ORDER BY check_in DESC;
