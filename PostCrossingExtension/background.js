// background.js

// Extract numeric part from PostCrossing URL (e.g. CL-34269 -> 34269)
function extractPostcardNumber(url) {
  const match = url.match(/postcards\/[A-Z]{2}-(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

// Listen for messages from popup.js
browser.runtime.onMessage.addListener(async (message) => {
  if (message.cmd === "sort") {
    const tabs = await browser.tabs.query({ url: "*://www.postcrossing.com/postcards/*" });

    if (tabs.length === 0) {
      return { success: false, error: "No PostCrossing tabs open" };
    }

    const sorted = tabs
      .map(tab => ({
        id: tab.id,
        number: extractPostcardNumber(tab.url),
      }))
      .filter(t => t.number !== null)
      .sort((a, b) => message.order === "desc" ? b.number - a.number : a.number - b.number);

    for (let i = 0; i < sorted.length; i++) {
      await browser.tabs.move(sorted[i].id, { index: i });
    }

    return { success: true, windowsProcessed: 1 };
  }
});
