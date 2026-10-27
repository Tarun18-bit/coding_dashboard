-- Schema for Coding Progress Dashboard
-- Run this in Supabase SQL Editor

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Accounts table (e.g. Codeforces, LeetCode handles per user)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'codeforces' | 'leetcode'
    handle TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, platform, handle)
);

-- 4. Snapshots table (daily / periodic stats summary)
CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    solved_total INTEGER NOT NULL DEFAULT 0,
    easy INTEGER NOT NULL DEFAULT 0,
    medium INTEGER NOT NULL DEFAULT 0,
    hard INTEGER NOT NULL DEFAULT 0,
    rating INTEGER,
    max_rating INTEGER,
    raw_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Contests table (contest participation history)
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contest_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    rank INTEGER,
    rating_before INTEGER,
    rating_after INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Submissions table (deduplicated problem submissions)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    platform_submission_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    title TEXT NOT NULL,
    verdict TEXT NOT NULL, -- 'AC' | 'WA' | 'TLE' etc.
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT, -- 'Easy' | 'Medium' | 'Hard' or CF rating string
    submitted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_account_submission UNIQUE (account_id, platform_submission_id)
);

-- 7. Precomputed Leaderboard Cache table (enables instant O(1) leaderboard queries for 10k+ users)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
    total_solved INTEGER NOT NULL DEFAULT 0,
    easy INTEGER NOT NULL DEFAULT 0,
    medium INTEGER NOT NULL DEFAULT 0,
    hard INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    highest_rating INTEGER,
    best_platform TEXT NOT NULL DEFAULT 'Unrated',
    connected_platforms TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_account_id_taken_at ON snapshots(account_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_contests_account_id_date ON contests(account_id, date ASC);
CREATE INDEX IF NOT EXISTS idx_submissions_account_id_submitted_at ON submissions(account_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_verdict ON submissions(verdict);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_ranking ON leaderboard_cache(total_solved DESC, current_streak DESC);

-- Seed default user & accounts if not present
INSERT INTO users (id, username)
VALUES ('00000000-0000-0000-0000-000000000001', 'default_user')
ON CONFLICT (username) DO NOTHING;
