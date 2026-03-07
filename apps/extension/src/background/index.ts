// Background service worker
const NARRA_BASE = "http://localhost:3001";

// Open side panel when extension icon clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "VALIDATE_BUILDER") {
    const { username, tweetText, isCharitable } = message.data;

    // Check cache in session storage first
    chrome.storage.session.get(`validated_${username}`).then((cached) => {
      if (cached[`validated_${username}`] !== undefined) {
        sendResponse({ valid: cached[`validated_${username}`] });
        // If valid, store as detected builder for browse tab
        if (cached[`validated_${username}`]) {
          pushDetectedBuilder(message.data);
        }
        return;
      }

      const params = new URLSearchParams({ username, text: tweetText ?? "" });
      fetch(`${NARRA_BASE}/api/validate-builder?${params}`)
        .then((r) => r.json())
        .then((data: { valid: boolean }) => {
          chrome.storage.session.set({ [`validated_${username}`]: data.valid });
          sendResponse({ valid: data.valid });
          if (data.valid) {
            pushDetectedBuilder({ ...message.data, ...data });
          }
        })
        .catch(() => {
          // No Narra API — fall back: accept if charitable or basic builder keywords
          const fallback = isCharitable ?? false;
          sendResponse({ valid: fallback });
        });
    });

    return true; // async response
  }

  if (message.type === "OPEN_SIDEPANEL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.sidePanel.open({ tabId: tabs[0].id });
    });
    return false;
  }

  return false;
});

async function pushDetectedBuilder(builder: object) {
  const stored = await chrome.storage.session.get("detectedBuilders");
  const list: object[] = stored.detectedBuilders ?? [];
  // Deduplicate by username
  const username = (builder as { username: string }).username;
  const exists = list.some((b) => (b as { username: string }).username === username);
  if (!exists) {
    list.unshift(builder); // newest first
    if (list.length > 50) list.pop(); // cap at 50
    await chrome.storage.session.set({ detectedBuilders: list });
  }
}
