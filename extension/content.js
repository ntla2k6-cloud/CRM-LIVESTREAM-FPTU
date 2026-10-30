// Chạy trong trang TikTok LIVE: theo dõi khung chat, gửi từng comment mới về background.
// Có thể bị inject 2 lần (manifest + popup executeScript) → chỉ khởi tạo 1 lần.
if (!window.__fptuLiveCapture) {
  window.__fptuLiveCapture = true;

  let observer = null;
  let isCapturing = false;
  const processedComments = new Set();

  const COMMENT_SELECTOR = '[data-e2e="chat-message"], div[class*="DivChatMessage"], div[class*="DivCommentItemContainer"]';
  const USERNAME_SELECTORS = [
    '[data-e2e="message-owner-name"]',
    'span[class*="SpanIdentity"] a',
    'span[class*="SpanIdentity"]',
    'div[class*="DivUsernameContainer"]',
    'span[class*="SpanNickName"]',
  ];
  // TikTok hiện dùng class Tailwind (không có tên DivComment…) nên nội dung được lấy
  // bằng cách duyệt text node: bỏ phần tên và ô huy hiệu cấp fan (chỉ 1–2 chữ số).
  const TEXT_SELECTORS = ['[data-e2e="chat-message-text"]'];
  const BADGE_TEXT = /^\d{1,2}$/;

  function extractText(node, usernameEl) {
    const parts = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const text = t.nodeValue.trim();
      if (!text || usernameEl.contains(t)) continue;
      const parent = t.parentElement;
      if (BADGE_TEXT.test(text) && parent && parent.textContent.trim() === text) continue;
      parts.push(text);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Thông báo hệ thống (vào phòng, thả tim, chia sẻ, theo dõi, tặng quà) — không phải comment thật
  const SYSTEM_NODE_SELECTOR = '[data-e2e="social-message"], [data-e2e="enter-message"], [data-e2e="gift-message"], [data-e2e="like-message"]';
  const SYSTEM_TEXT_PATTERNS = [
    /^(đã )?(tham gia|vào phòng|joined)\b/i,
    /^(đã )?(thả tim|thích|liked)\b/i,
    /^(đã )?(chia sẻ|shared)\b/i,
    /^(đã )?(theo dõi|followed)\b/i,
    /^(đã )?(gửi|tặng|sent)\b.*(x\s?\d+)?$/i,
    /^is (new to|joining)/i,
  ];

  function isSystemMessage(node, content) {
    if (node.matches(SYSTEM_NODE_SELECTOR) || node.closest(SYSTEM_NODE_SELECTOR)) return true;
    return SYSTEM_TEXT_PATTERNS.some((re) => re.test(content));
  }

  function pick(node, selectors) {
    for (const sel of selectors) {
      const el = node.querySelector(sel);
      if (el && el.textContent.trim()) return el;
    }
    return null;
  }

  // Hash ngắn để ID comment ổn định: cùng người + cùng nội dung trong 1 phút = 1 comment
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function extractComment(node) {
    const usernameEl = pick(node, USERNAME_SELECTORS);
    if (!usernameEl) return null;
    const displayName = usernameEl.textContent.trim().replace(/^@/, '');
    // Tài khoản (@handle) lấy từ link profile nếu có, không thì dùng tên hiển thị
    const profileLink = node.querySelector('a[href*="/@"]');
    const handleMatch = profileLink && profileLink.getAttribute('href').match(/\/@([^/?#]+)/);
    const username = handleMatch ? decodeURIComponent(handleMatch[1]) : displayName;
    const avatarEl = node.querySelector('img[src]');
    const avatar = avatarEl ? avatarEl.src : undefined;

    const textEl = pick(node, TEXT_SELECTORS);
    let content = textEl && !textEl.contains(usernameEl) ? textEl.textContent.trim() : extractText(node, usernameEl);
    content = content.replace(/^[:：]\s*/, '');

    if (!username || !content) return null;
    if (isSystemMessage(node, content)) return null;
    return { username, displayName, avatar, content };
  }

  function handleNode(node) {
    try {
      const parsed = extractComment(node);
      if (!parsed) return;

      const key = `${parsed.username}:${parsed.content}`;
      if (processedComments.has(key)) return;
      processedComments.add(key);
      if (processedComments.size > 2000) {
        processedComments.delete(processedComments.values().next().value);
      }

      const now = Date.now();
      chrome.runtime.sendMessage({
        action: 'newComment',
        comment: {
          platformCommentId: `ext-${hash(key)}-${Math.floor(now / 60000)}`,
          username: parsed.username,
          displayName: parsed.displayName,
          avatar: parsed.avatar,
          content: parsed.content,
          timestamp: now,
        },
      }).catch(() => {});
    } catch (err) {
      console.error('[FPTU Capture] Lỗi đọc comment', err);
    }
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      if (!isCapturing) return;
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches(COMMENT_SELECTOR)) {
            handleNode(node);
          } else {
            node.querySelectorAll(COMMENT_SELECTOR).forEach(handleNode);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[FPTU Capture] Bắt đầu theo dõi comment.');
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log('[FPTU Capture] Dừng theo dõi comment.');
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCapture') {
      isCapturing = request.isCapturing;
      isCapturing ? startObserver() : stopObserver();
      sendResponse({ ok: true });
    } else if (request.action === 'ping') {
      sendResponse({ ok: true });
    }
  });

  // Trang được reload khi đang bắt → tự bật lại
  chrome.storage.local.get(['isCapturing', 'liveSessionId'], (result) => {
    if (result.isCapturing && result.liveSessionId) {
      isCapturing = true;
      startObserver();
    }
  });
}
