// Content Script for LeetCode Auto-Sync
(function () {
  let lastSyncedProblem = '';
  let lastSyncTime = 0;

  function showToast(message, isError = false) {
    const existing = document.getElementById('cpd-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cpd-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '999999';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '8px';
    toast.style.backgroundColor = isError ? '#450a0a' : '#052e16';
    toast.style.color = isError ? '#fca5a5' : '#86efac';
    toast.style.border = isError ? '1px solid #7f1d1d' : '1px solid #14532d';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.5)';
    toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '500';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.transition = 'all 0.3s ease';

    toast.innerHTML = `<span>${isError ? '⚠️' : '✓'}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : '';
  }

  function handleAcceptedVerdict() {
    const slug = getProblemSlug();
    const now = Date.now();

    // Debounce duplicate events within 30 seconds for the same problem
    if (slug === lastSyncedProblem && now - lastSyncTime < 30000) {
      return;
    }

    lastSyncedProblem = slug;
    lastSyncTime = now;

    chrome.runtime.sendMessage(
      {
        action: 'LEETCODE_ACCEPTED',
        slug: slug,
        url: window.location.href,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[Coding Progress]', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          showToast(`Accepted! Synced to Coding Progress Dashboard.`);
        } else if (response && response.error) {
          showToast(`Sync Notice: ${response.error}`, true);
        }
      }
    );
  }

  // Monitor DOM for submission result
  const observer = new MutationObserver(() => {
    // Check common LeetCode Accepted selectors and text
    const acceptedElements = document.querySelectorAll(
      '[data-e2e-locator="submission-result"], [data-state="success"], .text-green-s, .text-sd-easy, span'
    );

    for (const el of acceptedElements) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (text === 'Accepted' || text.startsWith('Accepted')) {
        handleAcceptedVerdict();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
