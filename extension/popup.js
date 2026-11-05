// Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const dashboardUrlInput = document.getElementById('dashboardUrl');
  const syncTokenInput = document.getElementById('syncToken');
  const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
  const saveBtn = document.getElementById('saveBtn');
  const manualSyncBtn = document.getElementById('manualSyncBtn');
  const statusMsg = document.getElementById('statusMsg');

  function showStatus(text, type = 'success') {
    statusMsg.textContent = text;
    statusMsg.className = `status ${type}`;
    setTimeout(() => {
      statusMsg.className = 'status';
    }, 3500);
  }

  // Load saved settings
  chrome.storage.sync.get(['dashboardUrl', 'syncToken', 'autoSyncEnabled'], (items) => {
    dashboardUrlInput.value = items.dashboardUrl || 'http://localhost:3000';
    syncTokenInput.value = items.syncToken || '';
    autoSyncCheckbox.checked = items.autoSyncEnabled !== false;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const dashboardUrl = dashboardUrlInput.value.trim().replace(/\/$/, '');
    const syncToken = syncTokenInput.value.trim();
    const autoSyncEnabled = autoSyncCheckbox.checked;

    chrome.storage.sync.set(
      {
        dashboardUrl,
        syncToken,
        autoSyncEnabled,
      },
      () => {
        showStatus('Settings saved successfully!');
      }
    );
  });

  // Manual Trigger Sync
  manualSyncBtn.addEventListener('click', async () => {
    manualSyncBtn.textContent = 'Syncing...';
    manualSyncBtn.disabled = true;

    const dashboardUrl = (dashboardUrlInput.value.trim() || 'http://localhost:3000').replace(/\/$/, '');
    const syncToken = syncTokenInput.value.trim();
    const targetUrl = `${dashboardUrl}/api/sync?force=true`;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        credentials: 'include', // send the dashboard login session cookie
        headers: {
          'Content-Type': 'application/json',
          ...(syncToken ? { Authorization: `Bearer ${syncToken}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      showStatus('Synced successfully!');
    } catch (err) {
      showStatus(err.message || 'Connection failed', 'error');
    } finally {
      manualSyncBtn.textContent = 'Sync Now';
      manualSyncBtn.disabled = false;
    }
  });
});
