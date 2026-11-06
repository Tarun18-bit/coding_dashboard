-- Migration 002: real clans, persistent profiles, snapshot cleanup, faster queries.
-- Safe to run more than once. Run in Supabase: SQL Editor -> paste -> Run.

-- 1. Public profile fields (bio, status and social links shown on /u/<username>)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_text TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- 2. Clans (shared study groups)
CREATE TABLE IF NOT EXISTS clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '🔥',
    category TEXT NOT NULL DEFAULT 'Casual',
    weekly_target INTEGER NOT NULL DEFAULT 50 CHECK (weekly_target > 0),
    invite_code TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_members (
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (clan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_members_user_id ON clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clans_owner_id ON clans(owner_id);

-- Same lock-down as the other tables: only the server (service-role key) can access them
ALTER TABLE clans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;

-- 3. Snapshot cleanup. Hourly syncs used to keep every snapshot forever, each with a large
--    raw_json blob. Keep only the newest snapshot per account per day...
DELETE FROM snapshots s
USING (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY account_id, (taken_at AT TIME ZONE 'UTC')::date
               ORDER BY taken_at DESC
           ) AS rn
    FROM snapshots
) ranked
WHERE s.id = ranked.id AND ranked.rn > 1;

-- ...and keep raw_json only on each account's latest snapshot.
UPDATE snapshots s
SET raw_json = NULL
WHERE raw_json IS NOT NULL
  AND taken_at < (SELECT MAX(taken_at) FROM snapshots s2 WHERE s2.account_id = s.account_id);

-- 4. Indexes for the new stats queries (accepted problems, recent activity)
CREATE INDEX IF NOT EXISTS idx_submissions_account_verdict_time
    ON submissions(account_id, verdict, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_last_synced_at ON accounts(last_synced_at ASC NULLS FIRST);

-- Postgres autovacuum reclaims the freed space automatically. (VACUUM is not run here because
-- the SQL Editor wraps scripts in a transaction, where VACUUM is not allowed.)
