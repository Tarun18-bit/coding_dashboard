-- Lock down direct database access.
-- The app reads and writes only through the server-side service-role client
-- (lib/db.ts -> supabaseAdmin), which bypasses RLS. The public anon key is used
-- in the browser for login only. Enabling RLS with no policies therefore blocks
-- anyone using the public anon key from reading or editing these tables directly,
-- without affecting the app.
--
-- Run once in the Supabase dashboard: SQL Editor -> paste -> Run.
-- PREREQUISITE: SUPABASE_SERVICE_ROLE_KEY must be set in Vercel, otherwise lib/db.ts
-- falls back to the anon key and the app will lose database access.

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
