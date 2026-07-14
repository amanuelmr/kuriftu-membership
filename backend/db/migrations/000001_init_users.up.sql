-- Users and membership. Column names use snake_case; the API layer maps them
-- to the frontend contract (firstName/lastName on read).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE membership_tier AS ENUM ('Basic', 'Golden', 'Platinum', 'Diamond');

CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name       TEXT        NOT NULL,
    last_name        TEXT        NOT NULL,
    email            TEXT        NOT NULL UNIQUE,
    phone            TEXT        NOT NULL DEFAULT '',
    password_hash    TEXT        NOT NULL,
    avatar           TEXT        NOT NULL DEFAULT '',
    membership_tier  membership_tier NOT NULL DEFAULT 'Basic',
    membership_id    TEXT        NOT NULL DEFAULT '',
    member_since     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
    points           BIGINT      NOT NULL DEFAULT 0,
    lifetime_points  BIGINT      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
