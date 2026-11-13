-- Migration 004: security hardening, index tidy-up and the in-database scheduler.
-- Safe to run more than once. Run after 003. (Applied to production on 14 Nov 2026.)

-- 1. leaderboard_cache was the one table without Row Level Security, so anyone holding the
--    public (anon) key could read, overwrite or delete leaderboard rows through the REST API.
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- 2. DashCode only touches tables from the server (service role); the browser uses Supabase for
--    login only. Remove every table privilege from the public roles so data stays private even
--    if a future table forgets RLS.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- 3. Indexes: one the sync uses (re-tagging stored LeetCode solves), two that were never used
CREATE INDEX IF NOT EXISTS idx_submissions_account_problem ON public.submissions (account_id, problem_id);
DROP INDEX IF EXISTS public.idx_accounts_user_id;     -- covered by UNIQUE (user_id, platform, handle)
DROP INDEX IF EXISTS public.idx_submissions_verdict;  -- covered by (account_id, verdict, submitted_at)

-- 4. Scheduler: pg_cron + pg_net let the database call /api/sync itself every hour, so stats stay
--    fresh even when GitHub skips scheduled runs. The job is added in step 5 (needs the token).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 5. (Run by the owner, with the real token from Vercel's SYNC_SECRET_TOKEN)
-- SELECT vault.create_secret('PASTE_SYNC_SECRET_TOKEN_HERE', 'dashcode_sync_token', 'Bearer token for /api/sync');
-- SELECT cron.schedule(
--   'dashcode-hourly-sync',
--   '41 * * * *',
--   $job$
--   SELECT net.http_post(
--     url := 'https://coding-dashboard-two.vercel.app/api/sync',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'dashcode_sync_token')
--     ),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 30000
--   );
--   $job$
-- );
