document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const sessionIdInput = document.getElementById('sessionId');
  const statusDiv = document.getElementById('status');

  // Load saved session ID
  chrome.storage.local.get(['liveSessionId', 'isCapturing'], (result) => {
    if (result.liveSessionId) {
      sessionIdInput.value = result.liveSessionId;
    }
    if (result.isCapturing) {
      startBtn.textContent = 'Đang thu thập... (Dừng)';
      statusDiv.textContent = 'Capturing is active.';
    }
  });

  startBtn.addEventListener('click', () => {
    const sessionId = sessionIdInput.value.trim();
    if (!sessionId) {
      alert('Vui lòng nhập Live Session ID');
      return;
    }

    chrome.storage.local.get(['isCapturing'], (result) => {
      const isCapturing = !result.isCapturing;
      
      chrome.storage.local.set({ liveSessionId: sessionId, isCapturing: isCapturing }, () => {
        if (isCapturing) {
          startBtn.textContent = 'Đang thu thập... (Dừng)';
          statusDiv.textContent = 'Capturing is active.';
        } else {
          startBtn.textContent = 'Bắt đầu thu thập';
          statusDiv.textContent = '';
        }

        // Notify content script to start/stop
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0] && tabs[0].url.includes("tiktok.com")) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleCapture", isCapturing, sessionId });
          }
        });
      });
    });
  });
});
