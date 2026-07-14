-- Bookings, offers, and onboarding survey.

CREATE TABLE bookings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    location   TEXT NOT NULL DEFAULT '',
    image      TEXT NOT NULL DEFAULT '',
    check_in   DATE NOT NULL,
    check_out  DATE NOT NULL,
    guests     INT  NOT NULL DEFAULT 1,
    status     TEXT NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
    price      TEXT NOT NULL DEFAULT '',
    amenities  TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user ON bookings (user_id, check_in DESC);

-- Offers are global (not per-user).
CREATE TABLE offers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image       TEXT NOT NULL DEFAULT '',
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    expiry      DATE NOT NULL,
    discount    TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One onboarding survey response per user (upserted).
CREATE TABLE surveys (
    user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    visit_purpose           TEXT   NOT NULL DEFAULT '',
    preferred_accommodation TEXT[] NOT NULL DEFAULT '{}',
    interests               TEXT[] NOT NULL DEFAULT '{}',
    travel_frequency        TEXT   NOT NULL DEFAULT '',
    special_occasions       TEXT   NOT NULL DEFAULT '',
    additional_notes        TEXT   NOT NULL DEFAULT '',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed a few active offers.
INSERT INTO offers (title, description, expiry, discount, image) VALUES
    ('Weekend Getaway',   'Book a 2-night weekend stay and enjoy a complimentary spa session.', DATE '2026-12-31', '20%', ''),
    ('Dining Delight',    'Enjoy 15% off at all resort restaurants this month.',               DATE '2026-12-31', '15%', ''),
    ('Early Bird Special','Reserve 30 days in advance and save on your accommodation.',         DATE '2026-12-31', '25%', '');
