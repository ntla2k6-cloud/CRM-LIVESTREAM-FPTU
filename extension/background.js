// Gom comment từ content script, cứ 2 giây đẩy 1 lô về backend CRM.
// Backend lưu LiveComment, phân loại và tự tạo/cập nhật Lead (comment-engine/pipeline.service.ts).

const DEFAULT_API_URL = 'https://crm-livestream-fptu.onrender.com';
const BATCH_SIZE = 50;
const MAX_QUEUE = 5000;

let commentQueue = [];
let isCapturing = false;
let currentSessionId = null;
let apiUrl = DEFAULT_API_URL;
let stats = { captured: 0, synced: 0 };
let flushing = false;

// Service worker MV3 có thể bị tắt bất kỳ lúc nào → giữ hàng đợi trong storage.session
const ready = Promise.all([
  chrome.storage.local.get(['isCapturing', 'liveSessionId', 'apiUrl', 'stats']),
  chrome.storage.session.get(['commentQueue']),
]).then(([local, session]) => {
  isCapturing = local.isCapturing || false;
  currentSessionId = local.liveSessionId || null;
  apiUrl = local.apiUrl || DEFAULT_API_URL;
  if (local.stats) stats = local.stats;
  commentQueue = [...(session.commentQueue || []), ...commentQueue];
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.liveSessionId) currentSessionId = changes.liveSessionId.newValue;
  if (changes.apiUrl) apiUrl = changes.apiUrl.newValue || DEFAULT_API_URL;
  if (changes.isCapturing) {
    isCapturing = changes.isCapturing.newValue;
    if (!isCapturing) flushQueue(); // Dừng thì đẩy nốt phần còn lại
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'newComment' && request.comment) {
    ready.then(() => {
      if (!isCapturing) return;
      commentQueue.push(request.comment);
      if (commentQueue.length > MAX_QUEUE) commentQueue.splice(0, commentQueue.length - MAX_QUEUE);
      stats.captured++;
      saveQueue();
      updatePopupStats();
    });
    sendResponse({ success: true });
  } else if (request.action === 'resetAll') {
    // Nút Reset: bỏ cả comment chưa gửi (vd. bị kẹt do sai phiên)
    isCapturing = false;
    commentQueue = [];
    saveQueue();
    stats = { captured: 0, synced: 0 };
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
  chrome.runtime.sendMessage({
    action: 'updateStats',
    captured: stats.captured,
    synced: stats.synced,
  }).catch(() => {});
}

async function flushQueue() {
  await ready;
  if (flushing || commentQueue.length === 0 || !currentSessionId) return;
  flushing = true;

  const batch = commentQueue.slice(0, BATCH_SIZE);
  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/live-engine/extension-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveSessionId: currentSessionId, comments: batch }),
    });

    if (res.ok) {
      commentQueue.splice(0, batch.length);
      saveQueue();
      stats.synced += batch.length;
      updatePopupStats();
      setSyncState(null);
    } else {
      const text = await res.text();
      console.error('Gửi comment thất bại', res.status, text);
      setSyncState(`Server trả lỗi ${res.status}: ${text.slice(0, 120)}`);
    }
  } catch (e) {
    console.error('Lỗi mạng khi gửi comment', e);
    setSyncState(`Không kết nối được ${apiUrl} (${e.message}). Server Render có thể đang khởi động, sẽ tự thử lại.`);
  } finally {
    flushing = false;
  }
}

setInterval(() => {
  if (isCapturing || commentQueue.length) flushQueue();
}, 2000);
