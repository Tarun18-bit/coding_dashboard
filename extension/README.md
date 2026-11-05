# 🧩 Coding Progress - LeetCode Auto-Sync Chrome Extension

This Chrome extension detects when you solve a problem on LeetCode (**Accepted** verdict) and automatically triggers an instant sync to your Coding Progress Dashboard so you never have to manually click sync!

---

## 🚀 How to Install in Chrome (Under 1 Minute)

1. Open Google Chrome.
2. Navigate to: `chrome://extensions/`
3. In the top right corner, toggle **"Developer mode"** ON.
4. Click the **"Load unpacked"** button in the top left.
5. Select this directory:
   ```
   C:\Users\tmaur\.gemini\antigravity\scratch\coding-progress-dashboard\extension
   ```
6. That's it! The extension is now active.

---

## ⚙️ Configuration

1. Click on the extension icon in your Chrome toolbar.
2. Verify or edit your settings:
   - **Dashboard URL**: `http://localhost:3000` (or your deployed Vercel URL, e.g. `https://your-dashboard.vercel.app`)
   - **Sync Secret Token**: Leave blank. The extension uses your dashboard login, so stay logged in to the dashboard in Chrome.
   - If you deploy to a different domain, add it to `host_permissions` in `manifest.json`.
   - **Auto-sync**: Checked
3. Click **"Save"**.

---

## 🎯 How It Works
- Whenever you submit code on `leetcode.com/problems/*` and get an **Accepted** result, the extension displays a subtle confirmation toast:  
  `✓ Accepted! Synced to Coding Progress Dashboard.`
- Your dashboard numbers, streak, and recent submissions list update immediately!
