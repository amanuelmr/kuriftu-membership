-- Payment methods (NO raw PAN/CVV — only brand + last4 + expiry are stored)
-- and payments processed through Chapa.

CREATE TABLE payment_methods (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand      TEXT NOT NULL CHECK (brand IN ('visa', 'mastercard', 'amex', 'discover')),
    last_four  TEXT NOT NULL,
    exp_month  TEXT NOT NULL,
    exp_year   TEXT NOT NULL,
    name       TEXT NOT NULL DEFAULT '',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_user ON payment_methods (user_id);

CREATE TABLE payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tx_ref         TEXT NOT NULL UNIQUE,
    description    TEXT NOT NULL DEFAULT '',
    amount         TEXT NOT NULL,
    currency       TEXT NOT NULL DEFAULT 'ETB',
    -- Contract statuses (frontend Payment.status): upcoming | completed | redeemed | failed.
    -- A freshly initialized Chapa checkout starts as 'upcoming' (pending).
    status         TEXT NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming', 'completed', 'redeemed', 'failed')),
    payment_method TEXT NOT NULL DEFAULT 'Chapa',
    checkout_url   TEXT NOT NULL DEFAULT '',
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments (user_id, occurred_at DESC);
