-- name: ListOffers :many
SELECT * FROM offers ORDER BY expiry ASC;
