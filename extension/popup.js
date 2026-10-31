const DEFAULT_API_URL = 'https://crm-livestream-fptu.onrender.com';
const LIVE_URL = /^https:\/\/www\.tiktok\.com\/@([^/?#]+)\/live/;

const liveUsernameOf = (url) => {
  const m = (url || '').match(LIVE_URL);
  return m ? decodeURIComponent(m[1]) : null;
};

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const sessionIdInput = document.getElementById('sessionId');
  const apiUrlInput = document.getElementById('apiUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const message = document.getElementById('message');
  const notice = document.getElementById('notice');
  const sessionInfo = document.getElementById('sessionInfo');
  const resetBtn = document.getElementById('resetBtn');
  const modes = document.querySelector('.modes');
  const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
  let confirmReset = false;
  const statusDot = document.getElementById('statusDot');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const statCaptured = document.getElementById('statCaptured');
  const statSyncing = document.getElementById('statSyncing');
  const statSkipped = document.getElementById('statSkipped');

  const selectedMode = () => (modeInputs.find((i) => i.checked) || modeInputs[0]).value;

  function showMessage(text) {
    message.textContent = text || '';
  }

  function showStats(s = {}) {
    statCaptured.textContent = s.captured || 0;
    statSyncing.textContent = s.synced || 0;
    statSkipped.textContent = s.skipped || 0;
  }

  // Dòng xanh: đang ghi vào phiên nào
  function renderSessions(st) {
    if (!st.isCapturing) return (sessionInfo.textContent = '');
    if (st.captureMode === 'multi') {
      const rows = Object.entries(st.sessionMap || {}).map(([u, s]) => `• @${u} → ${s.title}`);
      sessionInfo.textContent = rows.length ? `Đang ghi ${rows.length} kênh:\n${rows.join('\n')}` : 'Đang chờ comment từ các tab TikTok LIVE…';
    } else {
      sessionInfo.textContent = st.sessionTitle ? `Khóa @${st.boundUsername} → phiên CRM: ${st.sessionTitle}` : '';
    }
  }

  const VIEW_KEYS = ['sessionInput', 'sessionTitle', 'isCapturing', 'captureMode', 'boundUsername', 'sessionMap', 'stats', 'apiUrl', 'apiToken', 'lastError', 'lockNotice'];
  function refresh() {
    chrome.storage.local.get(VIEW_KEYS, (st) => {
      if (st.captureMode) modeInputs.forEach((i) => (i.checked = i.value === st.captureMode));
      apiUrlInput.value = st.apiUrl || DEFAULT_API_URL;
      apiTokenInput.value = st.apiToken || '';
      setCapturingState(!!st.isCapturing, st.captureMode);
      renderSessions(st);
      showStats(st.stats);
      showMessage(st.isCapturing ? st.lastError : '');
      notice.textContent = st.isCapturing && st.captureMode !== 'multi' ? st.lockNotice || '' : '';
    });
  }

  chrome.storage.local.get(['sessionInput'], (st) => {
    if (st.sessionInput) sessionIdInput.value = st.sessionInput;
  });
  refresh();

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateStats') showStats(request);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.lastError || changes.lockNotice || changes.sessionMap)) refresh();
  });

  // Link TikTok / link trang CRM / ID → phiên CRM (backend tự tạo phiên nếu là link TikTok mới)
  async function resolveSession(apiUrl, apiToken, input) {
    let res;
    try {
      res = await fetch(`${apiUrl}/live-engine/extension-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiToken ? { 'x-extension-token': apiToken } : {}) },
        body: JSON.stringify({ input }),
      });
    } catch (e) {
      throw new Error(`Không kết nối được ${apiUrl}. Server Render có thể đang khởi động, chờ ~1 phút rồi bấm lại.`);
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Sai hoặc thiếu Mã truy cập extension — hỏi admin CRM rồi nhập trong "Cài đặt server CRM".');
    if (!res.ok) throw new Error(data.message || `Server trả lỗi ${res.status}`);
    return data;
  }

  async function ensureHostPermission(url) {
    const origin = new URL(url).origin + '/*';
    if (await chrome.permissions.contains({ origins: [origin] })) return true;
    return chrome.permissions.request({ origins: [origin] });
  }

  // Tab mở trước khi cài/cập nhật extension chưa có content script → inject
  async function ensureContentScript(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    }
  }

  startBtn.addEventListener('click', async () => {
    showMessage('');
    const input = sessionIdInput.value.trim();
    const apiUrl = (apiUrlInput.value.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
    const apiToken = apiTokenInput.value.trim();
    const mode = selectedMode();

    const { isCapturing: wasCapturing } = await chrome.storage.local.get(['isCapturing']);
    if (wasCapturing) {
      await chrome.storage.local.set({ isCapturing: false, lockNotice: null });
      return refresh();
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUser = liveUsernameOf(tab && tab.url);
    const inputUser = input.includes('tiktok.com') ? liveUsernameOf(input) || (input.match(/@([^/?#\s]+)/) || [])[1] : null;

    if (mode === 'locked' && !tabUser) {
      return showMessage('Chế độ Khóa 1 phiên: hãy mở đúng trang TikTok LIVE (tiktok.com/@.../live) cần bắt rồi bấm lại.');
    }
    if (mode === 'locked' && inputUser && inputUser !== tabUser) {
      return showMessage(`Link nhập là @${inputUser} nhưng tab đang mở là @${tabUser}. Mở đúng tab @${inputUser} hoặc xóa ô nhập.`);
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
    let session = null;
    try {
      // multi: phiên cho tab hiện tại (nếu là LIVE) tạo sẵn; các kênh khác tự tạo khi có comment
      if (mode === 'locked' || input || tabUser) session = await resolveSession(apiUrl, apiToken, input || tab.url);
    } catch (e) {
      startBtn.disabled = false;
      setCapturingState(false, mode);
      return showMessage(e.message);
    }
    startBtn.disabled = false;

    // Mỗi lần bắt đầu lấy lại phiên mới nhất (backend tự dùng lại phiên đang LIVE của kênh trong 12h)
    const sessionMap = {};
    if (mode === 'multi' && session && tabUser) sessionMap[tabUser] = { id: session.id, title: session.title };

    await chrome.storage.local.set({
      captureMode: mode,
      sessionInput: input,
      liveSessionId: mode === 'locked' ? session.id : null,
      sessionTitle: mode === 'locked' ? session.title : null,
      boundTabId: mode === 'locked' ? tab.id : null,
      boundUsername: mode === 'locked' ? tabUser : null,
      sessionMap,
      apiUrl,
      apiToken,
      lastError: null,
      lockNotice: null,
      isCapturing: true,
    });

    // Gắn content script vào tab cần bắt (locked: tab hiện tại; multi: mọi tab LIVE đang mở)
    const tabs = mode === 'locked' ? [tab] : await chrome.tabs.query({ url: 'https://www.tiktok.com/@*/live*' });
    for (const t of tabs) await ensureContentScript(t.id).catch(() => {});
    if (mode === 'multi' && tabs.length === 0) showMessage('Chưa có tab TikTok LIVE nào đang mở — mở tab LIVE, extension sẽ tự bắt.');
    refresh();
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

    await chrome.storage.local.set({ isCapturing: false, lastError: null, lockNotice: null, sessionMap: {} });
    await chrome.storage.local.remove(['liveSessionId', 'sessionTitle', 'sessionInput', 'boundTabId', 'boundUsername']);
    await chrome.runtime.sendMessage({ action: 'resetAll' }).catch(() => {});

    sessionIdInput.value = '';
    showStats();
    showMessage('');
    refresh();
  });

  function setCapturingState(isCapturing, mode) {
    startBtn.textContent = isCapturing ? 'DỪNG THU THẬP' : 'BẮT ĐẦU THU THẬP';
    startBtn.classList.toggle('active', isCapturing);
    statusDot.classList.toggle('active', isCapturing);
    // Đang chạy thì không đổi chế độ (tránh lẫn dữ liệu); muốn đổi → Dừng trước
    modeInputs.forEach((i) => (i.disabled = isCapturing));
    modes.classList.toggle('locked-ui', isCapturing);
    statusTitle.textContent = isCapturing ? (mode === 'multi' ? 'Đang bắt nhiều tab' : 'Đang bắt (khóa 1 phiên)') : 'Đã tạm dừng';
    statusDesc.textContent = isCapturing
      ? mode === 'multi' ? 'Mọi tab TikTok LIVE, mỗi kênh 1 phiên CRM' : 'Chỉ tab + kênh đã gắn'
      : 'Chọn chế độ rồi nhấn Bắt Đầu';
  }
});
