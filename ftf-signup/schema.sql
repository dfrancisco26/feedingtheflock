-- Feeding the Flock SD — food distribution signups
-- Apply with:  npx wrangler d1 execute ftf-signups --remote --file=./schema.sql
--
-- Already applied an earlier version? See "Upgrading an existing database" in
-- the README — CREATE TABLE IF NOT EXISTS will not add the new column for you.

CREATE TABLE IF NOT EXISTS signups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  period      TEXT    NOT NULL,           -- 'YYYY-MM', assigned server-side
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  email       TEXT    NOT NULL,           -- as typed, for display
  email_norm  TEXT    NOT NULL,           -- lowercased+trimmed, for dedupe
  families    INTEGER NOT NULL,
  lang        TEXT    NOT NULL DEFAULT 'en',  -- 'en' | 'es'; language they signed up in
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  ip_hash     TEXT,                       -- SHA-256 of IP + salt, for abuse review only

  -- Did the confirmation email actually go out? 'pending' until the send
  -- resolves, then 'sent' / 'failed' / 'skipped' (skipped = email not
  -- configured). Surfaced in the CSV so a quota or delivery problem is visible
  -- to the board instead of buried in Worker logs.
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_error  TEXT                       -- short reason when status is 'failed'
);

-- One signup per email address per month. This is what makes the form "monthly":
-- the same person can come back next month, but not sign up twice in the same one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_signups_period_email
  ON signups(period, email_norm);

CREATE INDEX IF NOT EXISTS idx_signups_period ON signups(period);

-- Optional per-month control. If there is no row for a period, the form is open
-- and uncapped. Insert a row to cap or close a month early.
CREATE TABLE IF NOT EXISTS periods (
  period    TEXT PRIMARY KEY,             -- 'YYYY-MM'
  capacity  INTEGER,                      -- max total families; NULL = unlimited
  is_open   INTEGER NOT NULL DEFAULT 1,   -- 0 closes signups for that month
  note      TEXT                          -- shown to people when closed
);

-- Example: cap October at 150 families
-- INSERT INTO periods (period, capacity, is_open) VALUES ('2026-10', 150, 1);

-- Survives the retention purge. Personal data is deleted after 12 months, but
-- the counts stay here forever so grant and board reporting still works.
CREATE TABLE IF NOT EXISTS period_stats (
  period       TEXT PRIMARY KEY,          -- 'YYYY-MM'
  signups      INTEGER NOT NULL,          -- how many households signed up
  families     INTEGER NOT NULL,          -- total families across those signups
  archived_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Small key/value scratch table. Currently holds 'last_purge' so the retention
-- sweep runs at most once a day instead of on every signup.
CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
