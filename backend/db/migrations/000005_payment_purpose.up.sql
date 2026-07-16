-- Tag payments with their purpose so a successful verification can complete the
-- intended action (e.g. grant a purchased membership tier).
ALTER TABLE payments ADD COLUMN purpose     TEXT NOT NULL DEFAULT 'general';
ALTER TABLE payments ADD COLUMN target_tier TEXT NOT NULL DEFAULT '';
