-- Migration 003: daily per-user usage limits (AI reviews, AI coach, C++/Java runs, account links).
-- Safe to run more than once. Run in Supabase: SQL Editor -> paste -> Run.

CREATE TABLE IF NOT EXISTS usage_counters (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    kind TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day, kind)
);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Atomically uses one unit of today's quota (UTC day).
-- Returns the new count, or -1 when the daily limit is already reached.
CREATE OR REPLACE FUNCTION consume_usage(p_user UUID, p_kind TEXT, p_limit INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO usage_counters (user_id, day, kind, count)
    VALUES (p_user, (NOW() AT TIME ZONE 'UTC')::date, p_kind, 1)
    ON CONFLICT (user_id, day, kind)
    DO UPDATE SET count = usage_counters.count + 1
    WHERE usage_counters.count < p_limit
    RETURNING count INTO new_count;

    RETURN COALESCE(new_count, -1);
END;
$$;

-- Only the server (service role) may call it
REVOKE ALL ON FUNCTION consume_usage(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_usage(UUID, TEXT, INTEGER) TO service_role;

-- Old counters are useless after a day; keep the table tiny
DELETE FROM usage_counters WHERE day < (NOW() AT TIME ZONE 'UTC')::date - 7;
