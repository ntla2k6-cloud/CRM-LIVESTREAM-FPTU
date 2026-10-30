// Chạy trong trang TikTok LIVE: theo dõi khung chat, gửi từng comment mới về background.
// Có thể bị inject 2 lần (manifest + popup executeScript) → chỉ khởi tạo 1 lần.
if (!window.__fptuLiveCapture) {
  window.__fptuLiveCapture = true;

  let observer = null;
  let isCapturing = false;
  const processedComments = new Set();

  const COMMENT_SELECTOR = '[data-e2e="chat-message"], [data-e2e="gift-message"], div[class*="DivChatMessage"], div[class*="DivCommentItemContainer"]';
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
  // Huy hiệu: cấp fan ("6"), hạng tặng quà ("Hạng 3", "Top 1", "No.2")
  const BADGE_TEXT = /^(?:\d{1,2}|(?:hạng|top|no\.?)\s?\d{1,2})$/i;

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

  // Dòng tặng quà: "đã gửi Hoa hồng x5" / "sent Rose x5" → lưu riêng (người tặng, quà, số lượng)
  const GIFT_NODE_SELECTOR = '[data-e2e="gift-message"]';
  const GIFT_TEXT = /^(?:đã\s+)?(?:gửi|tặng|sent)\b\s*(.*?)\s*(?:[x×]\s*(\d+))?$/i;

  function parseGift(node, content) {
    const m = content.match(GIFT_TEXT);
    const isGiftNode = node.matches(GIFT_NODE_SELECTOR) || node.closest(GIFT_NODE_SELECTOR);
    if (!m && !isGiftNode) return null;
    const imgs = [...node.querySelectorAll('img[alt], img[title]')];
    const giftImg = imgs[imgs.length - 1];
    const giftName = (m && m[1]) || (giftImg && (giftImg.alt || giftImg.title)) || 'Quà tặng';
    const countMatch = content.match(/[x×]\s*(\d+)\s*$/i);
    const giftCount = parseInt((m && m[2]) || (countMatch && countMatch[1]) || '1', 10);
    return { giftName: giftName.trim(), giftCount };
  }

  // Thông báo hệ thống (vào phòng, thả tim, chia sẻ, theo dõi) — không phải comment thật
  const SYSTEM_NODE_SELECTOR = '[data-e2e="social-message"], [data-e2e="enter-message"], [data-e2e="like-message"]';
  const SYSTEM_TEXT_PATTERNS = [
    /^(đã )?(tham gia|vào phòng|joined)\b/i,
    /^(đã )?(thả tim|thích|liked)\b/i,
    /^(đã )?(chia sẻ|shared)\b/i,
    /^(đã )?(theo dõi|followed)\b/i,
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

    // Dòng chỉ lặp lại tên (thông báo dạng icon) không phải comment
    if (!username || !content || content === displayName) return null;
    const gift = parseGift(node, content);
    if (gift) return { type: 'gift', username, displayName, avatar, content, ...gift };
    if (isSystemMessage(node, content)) return null;
    return { type: 'comment', username, displayName, avatar, content };
  }

  function handleNode(node) {
    try {
      const parsed = extractComment(node);
      if (!parsed) return;

      // Quà combo hiện x1, x2, x3… → key gồm số lượng để gửi bản cập nhật; backend gộp combo
      const key = parsed.type === 'gift'
        ? `gift:${parsed.username}:${parsed.giftName}:${parsed.giftCount}`
        : `${parsed.username}:${parsed.content}`;
      if (processedComments.has(key)) return;
      processedComments.add(key);
      if (processedComments.size > 2000) {
        processedComments.delete(processedComments.values().next().value);
      }

      const now = Date.now();
      chrome.runtime.sendMessage({
        action: 'newComment',
        // URL hiện tại (TikTok là SPA, đổi kênh không reload) → background lọc theo chế độ Khóa 1 phiên
        pageUrl: location.href,
        comment: {
          platformCommentId: `ext-${hash(key)}-${Math.floor(now / 60000)}`,
          type: parsed.type,
          username: parsed.username,
          displayName: parsed.displayName,
          avatar: parsed.avatar,
          content: parsed.content,
          giftName: parsed.giftName,
          giftCount: parsed.giftCount,
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

  // Mọi tab LIVE đều theo dõi khi đang bật thu thập; background quyết định giữ/bỏ theo chế độ.
  // Trang reload hoặc bật/tắt từ popup ở tab khác → tự đồng bộ qua storage.
  function applyCapturing(value) {
    isCapturing = !!value;
    isCapturing ? startObserver() : stopObserver();
  }
  chrome.storage.local.get(['isCapturing'], (result) => applyCapturing(result.isCapturing));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.isCapturing) applyCapturing(changes.isCapturing.newValue);
  });
}
