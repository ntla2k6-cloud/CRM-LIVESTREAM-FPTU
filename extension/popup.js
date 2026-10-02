document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const sessionIdInput = document.getElementById('sessionId');
  const statusDot = document.getElementById('statusDot');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const statCaptured = document.getElementById('statCaptured');
  const statSyncing = document.getElementById('statSyncing');

  // Load saved session ID
  chrome.storage.local.get(['liveSessionId', 'isCapturing', 'stats'], (result) => {
    if (result.liveSessionId) {
      sessionIdInput.value = result.liveSessionId;
    }
    if (result.isCapturing) {
      setCapturingState(true);
    }
    if (result.stats) {
      statCaptured.textContent = result.stats.captured || 0;
      statSyncing.textContent = result.stats.synced || 0;
    }
  });

  // Listen for background updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateStats') {
      statCaptured.textContent = request.captured || 0;
      statSyncing.textContent = request.synced || 0;
    }
  });

  startBtn.addEventListener('click', () => {
    let sessionId = sessionIdInput.value.trim();
    if (sessionId.includes('/live/')) {
      sessionId = sessionId.split('/live/').pop().split('?')[0];
      sessionIdInput.value = sessionId;
    }

    if (!sessionId) {
      alert('Vui lòng nhập Link hoặc ID phiên LIVE!');
      return;
    }

    chrome.storage.local.get(['isCapturing'], (result) => {
      const isCapturing = !result.isCapturing;
      
      chrome.storage.local.set({ liveSessionId: sessionId, isCapturing: isCapturing }, () => {
        setCapturingState(isCapturing);

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0] && tabs[0].url && tabs[0].url.includes("tiktok.com")) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleCapture", isCapturing, sessionId });
          } else {
            if (isCapturing) {
              alert('Cảnh báo: Bạn không đang ở trang tiktok.com! Hãy mở một luồng Tiktok LIVE để bắt đầu bắt comment.');
            }
          }
        });
      });
    });
  });

  function setCapturingState(isCapturing) {
    if (isCapturing) {
      startBtn.textContent = 'DỪNG THU THẬP';
      startBtn.classList.add('active');
      statusDot.classList.add('active');
      statusTitle.textContent = 'Đang hoạt động';
      statusDesc.textContent = 'Đang bắt dữ liệu trực tiếp...';
    } else {
      startBtn.textContent = 'BẮT ĐẦU THU THẬP';
      startBtn.classList.remove('active');
      statusDot.classList.remove('active');
      statusTitle.textContent = 'Đã tạm dừng';
      statusDesc.textContent = 'Nhấn Bắt Đầu để tiếp tục';
    }
  }
});
