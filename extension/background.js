// Gom comment từ content script, cứ 2 giây đẩy 1 lô về backend CRM.
// Backend lưu LiveComment, phân loại và tự tạo/cập nhật Lead (comment-engine/pipeline.service.ts).
//
// 2 chế độ (storage.local.captureMode):
//  - 'locked': chỉ nhận comment từ đúng tab + đúng kênh @user đã gắn lúc bấm Bắt đầu.
//              Tab chuyển sang kênh/trang khác → tạm bỏ qua; quay lại đúng kênh → bắt tiếp.
//  - 'multi' : nhận từ mọi tab TikTok LIVE (kể cả tab nền); mỗi kênh @user tự vào 1 phiên CRM riêng.

const DEFAULT_API_URL = 'https://crm-livestream-fptu.onrender.com';
const BATCH_SIZE = 50;
const MAX_QUEUE = 5000;

let commentQueue = []; // mỗi phần tử: { liveSessionId, comment }
let state = {
  isCapturing: false,
  captureMode: 'locked',
  liveSessionId: null, // phiên của chế độ locked
  boundTabId: null,
  boundUsername: null,
  sessionMap: {}, // chế độ multi: { username: { id, title } }
  apiUrl: DEFAULT_API_URL,
};
let stats = { captured: 0, synced: 0, skipped: 0 };
let flushing = false;
const resolving = new Map(); // username → Promise<session> (tránh tạo trùng phiên)

const STATE_KEYS = ['isCapturing', 'captureMode', 'liveSessionId', 'boundTabId', 'boundUsername', 'sessionMap', 'apiUrl'];

// Service worker MV3 có thể bị tắt bất kỳ lúc nào → giữ hàng đợi trong storage.session
const ready = Promise.all([
  chrome.storage.local.get([...STATE_KEYS, 'stats']),
  chrome.storage.session.get(['commentQueue']),
]).then(([local, session]) => {
  for (const k of STATE_KEYS) if (local[k] !== undefined && local[k] !== null) state[k] = local[k];
  state.apiUrl = state.apiUrl || DEFAULT_API_URL;
  if (local.stats) stats = { ...stats, ...local.stats };
  commentQueue = [...(session.commentQueue || []), ...commentQueue].filter((q) => q && q.comment);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const k of STATE_KEYS) if (changes[k]) state[k] = changes[k].newValue ?? (k === 'sessionMap' ? {} : null);
  if (changes.apiUrl) state.apiUrl = changes.apiUrl.newValue || DEFAULT_API_URL;
  if (changes.isCapturing && !changes.isCapturing.newValue) flushQueue(); // Dừng thì đẩy nốt phần còn lại
});

// Tab đã gắn bị đóng → cho phép gắn lại vào tab mới mở đúng kênh đó
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.boundTabId) {
    state.boundTabId = null;
    chrome.storage.local.set({ boundTabId: null });
  }
});

function liveUsernameOf(url) {
  const m = (url || '').match(/^https:\/\/www\.tiktok\.com\/@([^/?#]+)\/live/);
  return m ? decodeURIComponent(m[1]) : null;
}

function setLockNotice(text) {
  chrome.storage.local.set({ lockNotice: text || null });
}

async function sessionForMulti(username) {
  if (state.sessionMap[username]) return state.sessionMap[username];
  if (!resolving.has(username)) {
    resolving.set(username, (async () => {
      const res = await fetch(`${state.apiUrl.replace(/\/+$/, '')}/live-engine/extension-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `https://www.tiktok.com/@${username}/live` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Server trả lỗi ${res.status}`);
      state.sessionMap = { ...state.sessionMap, [username]: { id: data.id, title: data.title } };
      await chrome.storage.local.set({ sessionMap: state.sessionMap });
      return state.sessionMap[username];
    })().finally(() => resolving.delete(username)));
  }
  return resolving.get(username);
}

/** Trả về liveSessionId cần ghi, hoặc null nếu comment này phải bỏ qua. */
async function targetSession(pageUrl, tabId) {
  const username = liveUsernameOf(pageUrl);
  if (!username) return null;

  if (state.captureMode === 'multi') {
    return (await sessionForMulti(username)).id;
  }

  // locked
  if (!state.liveSessionId || !state.boundUsername) return null;
  if (username !== state.boundUsername) {
    if (tabId === state.boundTabId) setLockNotice(`Tab đã chuyển sang @${username} — tạm dừng, quay lại @${state.boundUsername} để bắt tiếp.`);
    return null;
  }
  if (state.boundTabId === null) {
    // tab gốc đã đóng, kênh đúng được mở lại ở tab mới → gắn vào tab này
    state.boundTabId = tabId;
    chrome.storage.local.set({ boundTabId: tabId });
  }
  if (tabId !== state.boundTabId) return null; // cùng kênh nhưng tab khác → chỉ tính tab đã gắn
  setLockNotice(null);
  return state.liveSessionId;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'newComment' && request.comment) {
    const tabId = sender.tab ? sender.tab.id : null;
    const pageUrl = request.pageUrl || (sender.tab && sender.tab.url) || sender.url;
    ready
      .then(async () => {
        if (!state.isCapturing) return;
        const liveSessionId = await targetSession(pageUrl, tabId);
        if (!liveSessionId) {
          stats.skipped++;
          updatePopupStats();
          return;
        }
        commentQueue.push({ liveSessionId, comment: request.comment });
        if (commentQueue.length > MAX_QUEUE) commentQueue.splice(0, commentQueue.length - MAX_QUEUE);
        stats.captured++;
        saveQueue();
        updatePopupStats();
      })
      .catch((e) => setSyncState(`Không tạo được phiên CRM: ${e.message}`));
    sendResponse({ success: true });
  } else if (request.action === 'resetAll') {
    // Nút Reset: bỏ cả comment chưa gửi (vd. bị kẹt do sai phiên)
    state = { ...state, isCapturing: false, liveSessionId: null, boundTabId: null, boundUsername: null, sessionMap: {} };
    commentQueue = [];
    saveQueue();
    stats = { captured: 0, synced: 0, skipped: 0 };
    setLockNotice(null);
    updatePopupStats();
    sendResponse({ success: true });
  }
});

function saveQueue() {
  chrome.storage.session.set({ commentQueue }).catch(() => {});
}

function setSyncState(lastError) {
  chrome.storage.local.set({ lastError, lastSyncAt: lastError ? undefined : Date.now() });
}

function updatePopupStats() {
  chrome.storage.local.set({ stats });
  chrome.runtime.sendMessage({ action: 'updateStats', ...stats }).catch(() => {});
}

async function flushQueue() {
  await ready;
  if (flushing || commentQueue.length === 0) return;
  flushing = true;

  // Mỗi request chỉ chứa comment của 1 phiên
  const sessionId = commentQueue[0].liveSessionId;
  const items = commentQueue.filter((q) => q.liveSessionId === sessionId).slice(0, BATCH_SIZE);
  try {
    const res = await fetch(`${state.apiUrl.replace(/\/+$/, '')}/live-engine/extension-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveSessionId: sessionId, comments: items.map((q) => q.comment) }),
    });

    if (res.ok) {
      const sent = new Set(items);
      commentQueue = commentQueue.filter((q) => !sent.has(q));
      saveQueue();
      stats.synced += items.length;
      updatePopupStats();
      setSyncState(null);
    } else {
      const text = await res.text();
      console.error('Gửi comment thất bại', res.status, text);
      if (res.status === 404) {
        // Phiên đã bị xóa trên CRM → bỏ comment của phiên đó, chế độ multi sẽ tự tạo phiên mới
        commentQueue = commentQueue.filter((q) => q.liveSessionId !== sessionId);
        for (const [u, s] of Object.entries(state.sessionMap)) if (s.id === sessionId) delete state.sessionMap[u];
        chrome.storage.local.set({ sessionMap: state.sessionMap });
        saveQueue();
        setSyncState('Phiên CRM không còn tồn tại (đã bị xóa). Bấm RESET rồi Bắt đầu lại.');
      } else {
        setSyncState(`Server trả lỗi ${res.status}: ${text.slice(0, 120)}`);
      }
    }
  } catch (e) {
    console.error('Lỗi mạng khi gửi comment', e);
    setSyncState(`Không kết nối được ${state.apiUrl} (${e.message}). Server Render có thể đang khởi động, sẽ tự thử lại.`);
  } finally {
    flushing = false;
  }
}

setInterval(() => {
  if (state.isCapturing || commentQueue.length) flushQueue();
}, 2000);
