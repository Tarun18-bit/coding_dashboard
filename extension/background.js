// Background Service Worker for Auto-Sync

const DEFAULT_SETTINGS = {
  dashboardUrl: 'http://localhost:3000',
  syncToken: '', // optional; normally your logged-in dashboard session is used
  autoSyncEnabled: true,
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['dashboardUrl', 'syncToken', 'autoSyncEnabled'], (items) => {
    if (!items.dashboardUrl) {
      chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'LEETCODE_ACCEPTED') {
    handleSyncRequest(message)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleSyncRequest(payload) {
  const settings = await chrome.storage.sync.get(['dashboardUrl', 'syncToken', 'autoSyncEnabled']);
  const dashboardUrl = (settings.dashboardUrl || DEFAULT_SETTINGS.dashboardUrl).replace(/\/$/, '');
  const syncToken = settings.syncToken || DEFAULT_SETTINGS.syncToken;
  const isEnabled = settings.autoSyncEnabled !== false;

  if (!isEnabled) {
    return { success: false, error: 'Auto-sync is disabled in extension settings' };
  }

  const syncUrl = `${dashboardUrl}/api/sync?force=true`;

  try {
    const res = await fetch(syncUrl, {
      method: 'POST',
      credentials: 'include', // send the dashboard login session cookie
      headers: {
        'Content-Type': 'application/json',
        ...(syncToken ? { Authorization: `Bearer ${syncToken}` } : {}),
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Coding Progress Auto-Sync Error]', err);
    return { success: false, error: err.message || 'Connection failed' };
  }
}
