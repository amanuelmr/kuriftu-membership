-- name: UpsertSurvey :one
INSERT INTO surveys (
    user_id, visit_purpose, preferred_accommodation, interests,
    travel_frequency, special_occasions, additional_notes
) VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (user_id) DO UPDATE SET
    visit_purpose           = EXCLUDED.visit_purpose,
    preferred_accommodation = EXCLUDED.preferred_accommodation,
    interests               = EXCLUDED.interests,
    travel_frequency        = EXCLUDED.travel_frequency,
    special_occasions       = EXCLUDED.special_occasions,
    additional_notes        = EXCLUDED.additional_notes,
    updated_at              = now()
RETURNING *;

-- name: GetSurvey :one
SELECT * FROM surveys WHERE user_id = $1;
