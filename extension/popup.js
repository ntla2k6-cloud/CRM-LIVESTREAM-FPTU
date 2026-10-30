const DEFAULT_API_URL = 'https://crm-livestream-fptu.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const sessionIdInput = document.getElementById('sessionId');
  const apiUrlInput = document.getElementById('apiUrl');
  const message = document.getElementById('message');
  const sessionInfo = document.getElementById('sessionInfo');
  const resetBtn = document.getElementById('resetBtn');
  let confirmReset = false;
  const statusDot = document.getElementById('statusDot');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const statCaptured = document.getElementById('statCaptured');
  const statSyncing = document.getElementById('statSyncing');

  function showMessage(text) {
    message.textContent = text || '';
  }

  chrome.storage.local.get(['sessionInput', 'sessionTitle', 'isCapturing', 'stats', 'apiUrl', 'lastError'], (result) => {
    if (result.sessionInput) sessionIdInput.value = result.sessionInput;
    if (result.isCapturing) showSession(result.sessionTitle);
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

  function showSession(title) {
    sessionInfo.textContent = title ? `Đang ghi vào phiên CRM: ${title}` : '';
  }

  // Link TikTok / link trang CRM / ID → phiên CRM (backend tự tạo phiên nếu là link TikTok mới)
  async function resolveSession(apiUrl, input) {
    let res;
    try {
      res = await fetch(`${apiUrl}/live-engine/extension-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
    } catch (e) {
      throw new Error(`Không kết nối được ${apiUrl}. Server Render có thể đang khởi động, chờ ~1 phút rồi bấm lại.`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Server trả lỗi ${res.status}`);
    return data;
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
    const input = sessionIdInput.value.trim();
    const apiUrl = (apiUrlInput.value.trim() || DEFAULT_API_URL).replace(/\/+$/, '');

    const { isCapturing: wasCapturing } = await chrome.storage.local.get(['isCapturing']);
    const isCapturing = !wasCapturing;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const onLivePage = tab && tab.url && /^https:\/\/www\.tiktok\.com\/@[^/]+\/live/.test(tab.url);

    let session = null;
    if (isCapturing) {
      if (!onLivePage) {
        return showMessage('Hãy mở trang TikTok LIVE (tiktok.com/@.../live) rồi bấm lại.');
      }
      try {
        new URL(apiUrl);
      } catch {
        return showMessage('Địa chỉ backend không hợp lệ.');
      }
      if (!(await ensureHostPermission(apiUrl))) {
        return showMessage('Cần cấp quyền truy cập server CRM để gửi comment.');
      }
      startBtn.disabled = true;
      startBtn.textContent = 'ĐANG KẾT NỐI CRM...';
      try {
        session = await resolveSession(apiUrl, input || tab.url);
      } catch (e) {
        setCapturingState(false);
        return showMessage(e.message);
      } finally {
        startBtn.disabled = false;
      }
    }

    await chrome.storage.local.set({
      sessionInput: input,
      ...(session ? { liveSessionId: session.id, sessionTitle: session.title } : {}),
      apiUrl,
      isCapturing,
      lastError: null,
    });
    showSession(isCapturing && session ? session.title : '');
    const sessionId = session ? session.id : undefined;
    setCapturingState(isCapturing);

    if (onLivePage) {
      try {
        await sendToTab(tab.id, { action: 'toggleCapture', isCapturing, sessionId });
      } catch (e) {
        showMessage('Không gắn được vào trang TikTok, hãy tải lại trang LIVE rồi thử lại.');
      }
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirmReset) {
      confirmReset = true;
      resetBtn.textContent = 'BẤM LẦN NỮA ĐỂ XÓA HẾT';
      setTimeout(() => {
        confirmReset = false;
        resetBtn.textContent = 'RESET';
      }, 3000);
      return;
    }
    confirmReset = false;
    resetBtn.textContent = 'RESET';

    await chrome.storage.local.set({ isCapturing: false, lastError: null });
    await chrome.storage.local.remove(['liveSessionId', 'sessionTitle', 'sessionInput']);
    await chrome.runtime.sendMessage({ action: 'resetAll' }).catch(() => {});

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('tiktok.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleCapture', isCapturing: false }).catch(() => {});
    }

    sessionIdInput.value = '';
    statCaptured.textContent = 0;
    statSyncing.textContent = 0;
    showSession('');
    showMessage('');
    setCapturingState(false);
  });

  function setCapturingState(isCapturing) {
    startBtn.textContent = isCapturing ? 'DỪNG THU THẬP' : 'BẮT ĐẦU THU THẬP';
    startBtn.classList.toggle('active', isCapturing);
    statusDot.classList.toggle('active', isCapturing);
    statusTitle.textContent = isCapturing ? 'Đang hoạt động' : 'Đã tạm dừng';
    statusDesc.textContent = isCapturing ? 'Đang bắt comment và gửi về CRM...' : 'Nhấn Bắt Đầu để tiếp tục';
  }
});
