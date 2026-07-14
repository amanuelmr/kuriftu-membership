-- Loyalty core: points ledger, rewards catalog, redemptions, membership benefits.

-- Points ledger. One row per earn/redeem event; balance_after is the user's
-- available balance immediately after this transaction.
CREATE TABLE points_transactions (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    description   TEXT        NOT NULL,
    category      TEXT        NOT NULL CHECK (category IN ('stays', 'dining', 'spa', 'points')),
    txn_type      TEXT        NOT NULL CHECK (txn_type IN ('earned', 'redeemed')),
    points        BIGINT      NOT NULL,
    amount        TEXT        NOT NULL DEFAULT '',
    balance_after BIGINT      NOT NULL
);

CREATE INDEX idx_points_tx_user ON points_transactions (user_id, occurred_at DESC);

-- Rewards catalog.
CREATE TABLE rewards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image           TEXT   NOT NULL DEFAULT '',
    title           TEXT   NOT NULL,
    description     TEXT   NOT NULL DEFAULT '',
    points_required BIGINT NOT NULL,
    category        TEXT   NOT NULL CHECK (category IN ('stays', 'experiences', 'merchandise', 'services')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward redemptions (audit trail; each also writes a points_transaction).
CREATE TABLE redemptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id    UUID   NOT NULL REFERENCES rewards(id),
    points_spent BIGINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membership benefit comparison rows. Values are stored as text; "true"/"false"
-- are surfaced as JSON booleans by the API to match the frontend contract
-- (golden/platinum/diamond: string | boolean).
CREATE TABLE membership_benefits (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    golden     TEXT NOT NULL DEFAULT 'false',
    platinum   TEXT NOT NULL DEFAULT 'false',
    diamond    TEXT NOT NULL DEFAULT 'false',
    sort_order INT  NOT NULL DEFAULT 0
);

-- Seed the rewards catalog.
INSERT INTO rewards (title, description, points_required, category, image) VALUES
    ('Luxury Spa Package',   '90-minute signature massage with aromatherapy and facial treatment.', 5000,  'experiences', ''),
    ('Fine Dining Experience','5-course tasting menu with wine pairing for two.',                    7500,  'experiences', ''),
    ('Private Lake Excursion','3-hour private boat tour of Lake Bishoftu with champagne and snacks.', 10000, 'experiences', ''),
    ('Free Night Stay',       'One complimentary night in a Deluxe Room with breakfast included.',    15000, 'stays',       ''),
    ('Kuriftu Luxury Bathrobe','Premium cotton bathrobe with Kuriftu Resort logo embroidery.',        3500,  'merchandise', ''),
    ('Airport Transfer',      'Luxury vehicle airport transfer service (one-way) with refreshments.', 2000,  'services',    '');

-- Seed the membership benefits comparison.
INSERT INTO membership_benefits (name, golden, platinum, diamond, sort_order) VALUES
    ('Discount on accommodations', '10%', '15%', '25%', 1),
    ('Discount at restaurants',    '5%',  '10%', '20%', 2),
    ('Early check-in',             'true','true','true', 3),
    ('Late checkout',              'false','true','true', 4),
    ('Room upgrade when available','false','true','true', 5),
    ('Complimentary spa treatment','false','true','true', 6),
    ('Airport transfers',          'false','false','true', 7),
    ('Dedicated personal assistant','false','false','true', 8);
