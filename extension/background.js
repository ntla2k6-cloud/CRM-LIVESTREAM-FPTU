let commentQueue = [];
let isCapturing = false;
let currentSessionId = null;
let stats = { captured: 0, synced: 0 };

chrome.storage.local.get(['isCapturing', 'liveSessionId', 'stats'], (result) => {
  isCapturing = result.isCapturing || false;
  currentSessionId = result.liveSessionId || null;
  if (result.stats) stats = result.stats;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.isCapturing) {
    isCapturing = changes.isCapturing.newValue;
    if (!isCapturing) {
      // Dừng thì flush queue
      flushQueue();
    }
  }
  if (changes.liveSessionId) {
    currentSessionId = changes.liveSessionId.newValue;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'newComment' && isCapturing) {
    commentQueue.push({
      platformCommentId: `ext-${Date.now()}-${Math.random()}`,
      username: request.data.username,
      content: request.data.text,
      timestamp: Date.now()
    });
    stats.captured++;
    updatePopupStats();
    sendResponse({ success: true });
  }
});

function updatePopupStats() {
  chrome.storage.local.set({ stats });
  chrome.runtime.sendMessage({
    action: 'updateStats',
    captured: stats.captured,
    synced: stats.synced
  }).catch(() => {});
}

async function flushQueue() {
  if (commentQueue.length === 0 || !currentSessionId) return;

  const commentsToSend = [...commentQueue];
  commentQueue = [];

  try {
    const res = await fetch('http://localhost:3001/live-engine/extension-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        liveSessionId: currentSessionId,
        comments: commentsToSend
      })
    });

    if (res.ok) {
      stats.synced += commentsToSend.length;
      updatePopupStats();
    } else {
      console.error('Failed to sync comments', await res.text());
      // Re-queue if failed
      commentQueue = [...commentsToSend, ...commentQueue];
    }
  } catch (e) {
    console.error('Network error syncing comments', e);
    commentQueue = [...commentsToSend, ...commentQueue];
  }
}

// Flush every 2 seconds
setInterval(() => {
  if (isCapturing) {
    flushQueue();
  }
}, 2000);
