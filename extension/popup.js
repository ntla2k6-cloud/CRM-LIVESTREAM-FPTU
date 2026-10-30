const DEFAULT_API_URL = 'https://crm-livestream-fptu.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const sessionIdInput = document.getElementById('sessionId');
  const apiUrlInput = document.getElementById('apiUrl');
  const message = document.getElementById('message');
  const statusDot = document.getElementById('statusDot');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const statCaptured = document.getElementById('statCaptured');
  const statSyncing = document.getElementById('statSyncing');

  function showMessage(text) {
    message.textContent = text || '';
  }

  chrome.storage.local.get(['liveSessionId', 'isCapturing', 'stats', 'apiUrl', 'lastError'], (result) => {
    if (result.liveSessionId) sessionIdInput.value = result.liveSessionId;
    apiUrlInput.value = result.apiUrl || DEFAULT_API_URL;
    setCapturingState(!!result.isCapturing);
    if (result.stats) {
      statCaptured.textContent = result.stats.captured || 0;
      statSyncing.textContent = result.stats.synced || 0;
    }
    if (result.isCapturing && result.lastError) showMessage(result.lastError);
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateStats') {
      statCaptured.textContent = request.captured || 0;
      statSyncing.textContent = request.synced || 0;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.lastError) showMessage(changes.lastError.newValue);
  });

  // Nhận cả ID lẫn link trang CRM dạng .../live/<id>
  function parseSessionId(value) {
    let id = value.trim();
    if (id.includes('/live/')) id = id.split('/live/').pop().split(/[/?#]/)[0];
    return id;
  }

  async function ensureHostPermission(url) {
    const origin = new URL(url).origin + '/*';
    if (await chrome.permissions.contains({ origins: [origin] })) return true;
    return chrome.permissions.request({ origins: [origin] });
  }

  // Tab mở trước khi cài extension chưa có content script → inject rồi gửi lại
  async function sendToTab(tabId, msg) {
    try {
      await chrome.tabs.sendMessage(tabId, msg);
    } catch {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      await chrome.tabs.sendMessage(tabId, msg);
    }
  }

  startBtn.addEventListener('click', async () => {
    showMessage('');
    const sessionId = parseSessionId(sessionIdInput.value);
    sessionIdInput.value = sessionId;
    const apiUrl = (apiUrlInput.value.trim() || DEFAULT_API_URL).replace(/\/+$/, '');

    const { isCapturing: wasCapturing } = await chrome.storage.local.get(['isCapturing']);
    const isCapturing = !wasCapturing;

    if (isCapturing) {
      if (!sessionId) return showMessage('Vui lòng dán link hoặc ID phiên LIVE trên CRM.');
      try {
        new URL(apiUrl);
      } catch {
        return showMessage('Địa chỉ backend không hợp lệ.');
      }
      if (!(await ensureHostPermission(apiUrl))) {
        return showMessage('Cần cấp quyền truy cập server CRM để gửi comment.');
      }
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onLivePage = tab && tab.url && /^https:\/\/www\.tiktok\.com\/@[^/]+\/live/.test(tab.url);
    if (isCapturing && !onLivePage) {
      return showMessage('Hãy mở trang TikTok LIVE (tiktok.com/@.../live) rồi bấm lại.');
    }

    await chrome.storage.local.set({ liveSessionId: sessionId, apiUrl, isCapturing, lastError: null });
    if (isCapturing) {
      chrome.runtime.sendMessage({ action: 'resetStats' }).catch(() => {});
    }
    setCapturingState(isCapturing);

    if (onLivePage) {
      try {
        await sendToTab(tab.id, { action: 'toggleCapture', isCapturing, sessionId });
      } catch (e) {
        showMessage('Không gắn được vào trang TikTok, hãy tải lại trang LIVE rồi thử lại.');
      }
    }
  });

  function setCapturingState(isCapturing) {
    startBtn.textContent = isCapturing ? 'DỪNG THU THẬP' : 'BẮT ĐẦU THU THẬP';
    startBtn.classList.toggle('active', isCapturing);
    statusDot.classList.toggle('active', isCapturing);
    statusTitle.textContent = isCapturing ? 'Đang hoạt động' : 'Đã tạm dừng';
    statusDesc.textContent = isCapturing ? 'Đang bắt comment và gửi về CRM...' : 'Nhấn Bắt Đầu để tiếp tục';
  }
});
