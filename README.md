# 🚀 Coding Progress Dashboard

A full-stack competitive programming and problem-solving analytics dashboard built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Supabase (PostgreSQL)**.

Track your stats, contest ratings, submissions, daily streaks, and topic proficiencies across multiple platforms (**Codeforces**, **LeetCode**, with extensible support for **CodeChef**, **GeeksforGeeks**, and more) in one unified interface.

---

## ✨ Features

- 📊 **Combined Multi-Platform Metrics**: Total solved problems, Easy/Medium/Hard breakdown across **Codeforces**, **LeetCode**, and **CodeChef**.
- ⏱️ **45-Minute Timed Mock Interview Simulator**: Timed assessments for **Google**, **Amazon**, **Meta**, and **Microsoft** with a countdown timer, progressive hint ladder, a **real test runner** (Python & TypeScript run in your browser via Pyodide/Sucrase; C++ & Java run on Judge0), and a post-interview scorecard.
- 👥 **Study Circles & Private Clans**: Create a private clan, share an invite link or code, and chase a weekly problem goal together. Weekly progress is counted from everyone's synced stats (new problems since Monday 00:00 UTC), with a live member leaderboard and a feed of recent solves.
- 📄 **1-Click ATS Developer Resume & Technical Sheet**: One-click recruiter-ready PDF/print export featuring verified multi-platform stats, contest ratings, topic strengths, and live verification URL.
- 🤖 **AI Solution Reviewer & FAANG Follow-Ups**: Google Gemini reviews your code for Big-O time & space complexity, bugs and bottlenecks, suggests an improved solution, and generates 5 interviewer follow-up questions. Falls back to a clearly labeled offline estimate when the AI is unavailable.
- 🎮 **Gamified RPG Level & Mastery Skill Tree**: Dynamic player levels (e.g. *Data Structure Knight*), XP progression, unlockable rarity badges, and an interactive 4-branch Skill Tree modal.
- 🔥 **Daily Smart POTD & Training Regimen**: Automated daily 3-problem workout (Warmup, Core Challenge, Boss Challenge) targeted at your growth areas with streak protection status.
- 📚 **Curated Sheet Auto-Sync**: Live interactive roadmaps for **Blind 75**, **NeetCode 150**, and **Striver SDE Sheet** with automated solve detection and filtering.
- 🏢 **Target Company Readiness & Gap Analyzer**: Evaluates interview readiness % for **Google, Amazon, Meta, Microsoft, Uber** based on company-specific topic weights, curating high-yield topics to solve next.
- 🛡️ **Dynamic GitHub README Badge & Profile Card**: Live, real-time SVG card (`/api/badge/[username]`) to embed directly into GitHub profile readmes with copyable Markdown.
- ⏳ **Upcoming Contest Radar & 1-Click Reminders**: Aggregated live contest schedules from Codeforces, LeetCode, and CodeChef with live countdowns and 1-click Google Calendar reminders.
- 🏆 **Global Leaderboard & 1v1 Compare Mode**: Multi-metric rankings and head-to-head comparisons (`/leaderboard` and `/compare`) against peers or benchmark coders.
- 🔥 **UTC-Safe Streak Tracker**: Current and longest streaks computed with UTC timestamps.
- 📅 **365-Day Activity Heatmap**: Interactive calendar-style activity squares with tooltips.
- 📈 **Contest Rating Progression**: Responsive timeline chart for Codeforces and LeetCode ratings with platform filtering.
- 📉 **Solved-Over-Time Chart**: Daily total-solved history (from daily snapshots) with last-7-days / last-30-days gains.
- 🔁 **Revision Queue**: Spaced-repetition picks of problems you solved 1 week to 4 months ago, weighted toward hard problems and weak topics.
- 🪪 **Public Profiles**: Shareable `/u/<username>` portfolio with a bio, status and GitHub/LinkedIn links saved to your account.
- 🎨 **DashDark Studio Aesthetics**: Built following modern dark theme designs with midnight blues, glowing electric accents, and crisp typography.
- 🔄 **Real-Time & Scheduled Sync**:
  - Top header **"Sync Now"** button with real-time feedback and automatic cache cooldown.
  - Hourly background sync of **every user** (stalest first) powered by a **GitHub Actions cron**.
- 🛡️ **Fault-Isolated Platform Architecture**: One platform failing or throttling will never break syncing for the others.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS (Dark Modern Theme)
- **Database**: Supabase (Postgres) via `@supabase/supabase-js`
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd coding-progress-dashboard
npm install
```

### 2. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Paste and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Then run [`supabase/migrations/002_clans_profiles.sql`](supabase/migrations/002_clans_profiles.sql) the same way (clans, profile fields, snapshot cleanup and indexes). It is safe to run more than once.

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

SYNC_SECRET_TOKEN=your_secure_random_sync_token
DEFAULT_CODEFORCES_HANDLE=oggy_18
DEFAULT_LEETCODE_USERNAME=txrun_18
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard!

---

## 🔌 How to Add a New Platform (e.g. CodeChef, AtCoder, GFG)

All platforms implement the standard `PlatformFetcher` interface located in [`lib/platforms/types.ts`](lib/platforms/types.ts):

```typescript
export interface PlatformFetcher {
  platformName: string;
  fetchProfile(handle: string): Promise<Snapshot>;
  fetchContests(handle: string): Promise<Contest[]>;
  fetchRecentSubmissions(handle: string, limit?: number): Promise<Submission[]>;
}
```

### 3 Simple Steps:
1. **Create Fetcher File**: Create `lib/platforms/myplatform.ts` implementing `PlatformFetcher` (see [`lib/platforms/codeforces.ts`](lib/platforms/codeforces.ts) or [`lib/platforms/codechef.ts`](lib/platforms/codechef.ts) for reference).
2. **Register in Sync Engine**: In [`app/api/sync/route.ts`](app/api/sync/route.ts), add your new fetcher to `Promise.allSettled`:
   ```typescript
   syncAccount(DEFAULT_USER_ID, 'myplatform', myHandle, myPlatformFetcher, force)
   ```
3. **Done!** The dashboard will automatically aggregate the solve counts, rating history, heatmap, and submissions for the new platform without requiring UI redesigns.

---

## ⚡ Automated Hourly Sync with GitHub Actions

The repository includes a ready-to-use GitHub Actions workflow in [`.github/workflows/sync.yml`](.github/workflows/sync.yml).

### To enable:
1. Go to your GitHub repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Add the following repository secrets:
   - `APP_URL`: Your deployed URL (e.g. `https://your-dashboard.vercel.app`)
   - `SYNC_SECRET_TOKEN`: The same token set in your `SYNC_SECRET_TOKEN` environment variable.

GitHub triggers `/api/sync` every hour. The endpoint answers immediately and then refreshes every user's accounts in the background (most out-of-date users first, within Vercel's 60-second limit), so all dashboards, clans and the leaderboard stay current.

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SYNC_SECRET_TOKEN`
   - `DEFAULT_CODEFORCES_HANDLE`
   - `DEFAULT_LEETCODE_USERNAME`
5. Click **Deploy**. Your dashboard is live!
