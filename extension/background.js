let commentQueue = [];
let flushInterval = null;
const FLUSH_INTERVAL_MS = 2000; // send every 2 seconds
const recentCommentsHash = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "newComment") {
    const { sessionId, comment } = request;
    
    // Deduplication check in background as well (using hash of username+content)
    const hash = `${comment.username}:${comment.content}`;
    if (!recentCommentsHash.has(hash)) {
      recentCommentsHash.add(hash);
      
      // Cleanup set to prevent memory leaks
      if (recentCommentsHash.size > 10000) {
        const iter = recentCommentsHash.values();
        for (let i = 0; i < 2000; i++) {
          recentCommentsHash.delete(iter.next().value);
        }
      }

      commentQueue.push({ sessionId, comment });
    }
  }
});

function flushQueue() {
  if (commentQueue.length === 0) return;

  // Group comments by session ID
  const grouped = commentQueue.reduce((acc, item) => {
    if (!acc[item.sessionId]) {
      acc[item.sessionId] = [];
    }
    acc[item.sessionId].push(item.comment);
    return acc;
  }, {});

  commentQueue = []; // clear queue

  // Send to backend
  for (const [sessionId, comments] of Object.entries(grouped)) {
    const payload = {
      liveSessionId: sessionId,
      comments: comments
    };

    fetch('http://localhost:3001/live-engine/extension-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(response => {
      if (!response.ok) {
        console.error('Failed to send comments:', response.statusText);
      }
    }).catch(error => {
      console.error('Error sending comments:', error);
    });
  }
}

// Start interval for flushing the queue periodically
flushInterval = setInterval(flushQueue, FLUSH_INTERVAL_MS);
