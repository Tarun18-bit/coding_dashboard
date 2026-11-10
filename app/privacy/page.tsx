import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="7 November 2026">
      <p>
        DashCode is a free, independent project that combines your public competitive-programming stats in one
        dashboard. This page explains what we store, why, and how to delete it.
      </p>

      <h2>What we store</h2>
      <ul>
        <li><strong>Account:</strong> your email address and a hashed password (handled by our authentication provider, Supabase).</li>
        <li><strong>Linked platforms:</strong> the Codeforces, LeetCode and CodeChef usernames you add, and the public data those platforms show for them (solved counts, ratings, contest history, recent accepted submissions).</li>
        <li><strong>Profile:</strong> the bio, status and GitHub/LinkedIn links you choose to add. These appear on your public profile page.</li>
        <li><strong>Clans:</strong> the clans you create or join, and your role in them.</li>
        <li><strong>Usage counters:</strong> how many AI reviews, code runs and account links you used today, to enforce fair daily limits. Old counters are deleted.</li>
      </ul>

      <h2>What is public</h2>
      <p>
        Your username, linked handles, combined stats, heatmap and profile fields are shown on your public profile
        (<code>/u/your-username</code>) and on the leaderboard. Other members of your clans see your weekly progress and recent solves.
      </p>

      <h2>Services that process your data</h2>
      <ul>
        <li><strong>Supabase</strong> (database and login) and <strong>Vercel</strong> (hosting).</li>
        <li><strong>Google Gemini</strong>: code you submit to the AI Reviewer is sent to Google for analysis. On Google&apos;s free tier, submitted content may be used by Google to improve its products, so don&apos;t paste anything confidential.</li>
        <li><strong>Judge0</strong>: C++ and Java code you run in mock interviews is compiled and executed on Judge0&apos;s servers. Python and TypeScript run only in your own browser.</li>
        <li><strong>Codeforces, LeetCode, CodeChef</strong>: we request your public profile data from them when your stats sync.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We only use the cookies needed to keep you logged in. There are no advertising or tracking cookies.</p>

      <h2>Deleting your data</h2>
      <p>
        Open your profile, click <strong>Edit Profile</strong>, then <strong>Delete my account</strong>. This permanently removes your
        account, linked platforms, stats history and clan memberships. Clans you lead are handed to another member.
        You can also unlink a single platform at any time from your dashboard.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data: open an issue at{' '}
        <a href="https://github.com/Tarun18-bit/coding_dashboard/issues" target="_blank" rel="noopener noreferrer">
          github.com/Tarun18-bit/coding_dashboard
        </a>
        .
      </p>
    </LegalPage>
  );
}
