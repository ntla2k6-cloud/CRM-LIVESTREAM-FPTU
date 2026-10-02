let observer = null;
let isCapturing = false;
let currentSessionId = null;
const processedComments = new Set();

function startObserver() {
  if (observer) return;
  
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function(mutationsList, observer) {
    if (!isCapturing) return;

    for(const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a comment message
            const commentMatch = node.matches && (node.matches('[data-e2e="chat-message"]') || node.matches('div[class*="DivCommentItemContainer"]'));
            const commentNode = commentMatch ? node : node.querySelector && node.querySelector('[data-e2e="chat-message"], div[class*="DivCommentItemContainer"]');
            
            if (commentNode) {
              extractAndSendComment(commentNode);
            }
          }
        });
      }
    }
  };

  observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  console.log("TikTok Live Comment Observer started.");
}

function extractAndSendComment(node) {
  try {
    // Try to get username and comment text based on common TikTok DOM structures
    const usernameElement = node.querySelector('span[class*="SpanIdentity"] a, span[class*="SpanIdentity"]') || node.querySelector('div[class*="DivUsernameContainer"]');
    const commentElement = node.querySelector('span[class*="SpanText"]') || node.querySelector('div[class*="DivCommentContent"]');
    
    if (!usernameElement || !commentElement) return;

    const username = usernameElement.textContent.trim();
    const content = commentElement.textContent.trim();
    
    if (!username || !content) return;

    // Create a unique key for deduplication on content side
    const commentKey = `${username}:${content}`;
    if (processedComments.has(commentKey)) return;
    
    processedComments.add(commentKey);
    // Keep set size reasonable to prevent memory leaks
    if (processedComments.size > 2000) {
      const iterator = processedComments.values();
      processedComments.delete(iterator.next().value);
    }

    const commentData = {
      platformCommentId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: username,
      content: content,
      timestamp: Date.now()
    };

    chrome.runtime.sendMessage({
      action: "newComment",
      sessionId: currentSessionId,
      comment: commentData
    });
  } catch (err) {
    console.error("Error extracting comment", err);
  }
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log("TikTok Live Comment Observer stopped.");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleCapture") {
    isCapturing = request.isCapturing;
    currentSessionId = request.sessionId;
    if (isCapturing) {
      startObserver();
    } else {
      stopObserver();
    }
  }
});

// Check initial state in case the page was reloaded while capture was active
chrome.storage.local.get(['isCapturing', 'liveSessionId'], (result) => {
  if (result.isCapturing && result.liveSessionId) {
    isCapturing = true;
    currentSessionId = result.liveSessionId;
    startObserver();
  }
});
