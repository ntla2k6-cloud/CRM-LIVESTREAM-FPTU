// ═══════════════════════════════════════════════════
//  app_v5.js – Vinsoul Academy v5.0
//  Load AFTER app_v4.js
//  Features:
//  1. Notification badge thực
//  2. Dashboard thông minh (Hôm Nay + KPI)
//  3. Holiday management
//  4. VietQR generator
//  5. Import Excel học viên
//  6. Mobile sidebar toggle
//  7. Dark mode enhancement
//  8. Report page upgrade (Chart.js)
//  9. Care page: server-backed care log
//  10. Student profile: payment history tab
// ═══════════════════════════════════════════════════

// ════════════════════════════════════════
// SECTION 1: NOTIFICATION BADGE THỰC
// ════════════════════════════════════════

let _notiDropdownOpen = false;
let _notiData = [];

function updateNotiBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  let count = 0;
  const now = new Date();

  // Count unpaid students
  const unpaid = (students || []).filter(s => s.payment === 'Chưa Thanh Toán').length;
  count += unpaid;

  // Count expiring ≤ 7 days
  const expiring = (students || []).filter(s => {
    if (!s.end || s.subject === 'Học Thử') return false;
    const d = Math.ceil((new Date(s.end) - now) / (1000 * 60 * 60 * 24));
    return d >= 0 && d <= 7;
  }).length;
  count += expiring;

  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function initNotiSystem() {
  try {
    const token = localStorage.getItem('vs_token');
    if (!token) return;

    // Trigger server-side reminder check
    await fetch('/api/check-reminders', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });

    // Load notifications
    const resp = await fetch('/api/notifications', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.ok) _notiData = await resp.json();
  } catch (e) { console.log('Noti init:', e.message); }

  updateNotiBadge();
  // Refresh badge every 30 seconds
  setInterval(updateNotiBadge, 30000);
}

// Override showNotifications to render dropdown
window.showNotifications = function () {
  // Remove existing dropdown
  const existing = document.getElementById('noti-dropdown');
  if (existing) { existing.remove(); _notiDropdownOpen = false; return; }

  _notiDropdownOpen = true;

  const now = new Date();

  // Build notification items from _notiData + live data
  const items = [];

  // Live: unpaid students
  (students || []).filter(s => s.payment === 'Chưa Thanh Toán').slice(0, 10).forEach(s => {
    items.push({
      icon: '💰', unread: true,
      msg: `<b>${s.name}</b> chưa thanh toán học phí (${s.subject || ''})`,
      time: 'Cần xử lý'
    });
  });

  // Live: expiring soon
  (students || []).filter(s => {
    if (!s.end || s.subject === 'Học Thử') return false;
    const d = Math.ceil((new Date(s.end) - now) / (1000 * 60 * 60 * 24));
    return d >= 0 && d <= 7;
  }).slice(0, 10).forEach(s => {
    const d = Math.ceil((new Date(s.end) - now) / (1000 * 60 * 60 * 24));
    items.push({
      icon: '⏰', unread: true,
      msg: `<b>${s.name}</b> còn ${d} ngày hết khóa (${s.subject || ''})`,
      time: `Hết: ${fmtDate(s.end)}`
    });
  });

  // Server notifications
  (_notiData || []).slice(0, 10).forEach(n => {
    items.push({
      icon: n.type === 'TUITION' ? '🔔' : '📢',
      unread: !n.read,
      msg: n.message || '',
      time: timeAgo(n.createdAt)
    });
  });

  const dd = document.createElement('div');
  dd.id = 'noti-dropdown';
  dd.innerHTML = `
    <div class="noti-header">
      <span>🔔 Thông Báo (${items.length})</span>
      <button onclick="markAllNotiRead()" style="background:none;border:none;color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Đánh dấu đã đọc</button>
    </div>
    <div class="noti-list">
      ${items.length ? items.map(it => `
        <div class="noti-item ${it.unread ? 'unread' : ''}">
          <div style="display:flex;gap:8px;align-items:flex-start;">
            <span style="font-size:16px;flex-shrink:0;">${it.icon}</span>
            <div>
              <div class="noti-msg">${it.msg}</div>
              <div class="noti-time">${it.time}</div>
            </div>
          </div>
        </div>
      `).join('') : '<div style="padding:30px;text-align:center;color:var(--muted);font-size:13px;">✅ Không có thông báo mới</div>'}
    </div>`;

  document.body.appendChild(dd);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeNoti(e) {
      if (!dd.contains(e.target) && e.target.id !== 'btn-noti' && !e.target.closest('#btn-noti')) {
        dd.remove();
        _notiDropdownOpen = false;
        document.removeEventListener('click', closeNoti);
      }
    });
  }, 50);
};

async function markAllNotiRead() {
  try {
    const token = localStorage.getItem('vs_token');
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    _notiData.forEach(n => n.read = true);
    showToast('Đã đánh dấu tất cả đã đọc');
    const dd = document.getElementById('noti-dropdown');
    if (dd) dd.remove();
  } catch (e) { console.error(e); }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
  return fmtDate(dateStr);
}


// ════════════════════════════════════════
// SECTION 2: DASHBOARD THÔNG MINH
// ════════════════════════════════════════

function initDashboardExtras() {
  const dashboard = document.getElementById('page-dashboard');
  if (!dashboard) return;

  // Remove old widget if exists
  const oldWidget = document.getElementById('dash-today-widget');
  if (oldWidget) oldWidget.remove();
  const oldKpi = document.getElementById('dash-kpi-widget');
  if (oldKpi) oldKpi.remove();

  const statsGrid = dashboard.querySelector('.stats-grid');
  if (!statsGrid) return;

  const now = new Date();
  const dayMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = dayMap[now.getDay()];
  const todayFmt = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Find today's classes
  const todayClasses = [];
  (classes || []).forEach(cls => {
    (cls.schedule || []).forEach(slot => {
      if (slot.day === todayName) {
        const studentCount = (students || []).filter(s => String(s.classid) === String(cls.id)).length;
        todayClasses.push({
          name: cls.name,
          subject: cls.subject || '',
          teacher: cls.teacher || '',
          start: slot.start || '',
          end: slot.end || '',
          room: cls.room || '',
          students: studentCount
        });
      }
    });
  });
  todayClasses.sort((a, b) => a.start < b.start ? -1 : 1);

  // Unpaid count
  const unpaidCount = (students || []).filter(s => s.payment === 'Chưa Thanh Toán').length;

  // ── TODAY WIDGET ──
  const widget = document.createElement('div');
  widget.id = 'dash-today-widget';
  widget.style.cssText = 'background:linear-gradient(135deg,#0d2137,#1a3a5c);border-radius:14px;padding:18px 20px;margin-bottom:16px;color:#fff;';
  widget.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:14px;font-weight:800;color:#fff;">📅 HÔM NAY</div>
        <div style="font-size:11px;color:rgba(255,255,255,.55);">${todayFmt}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="background:rgba(245,166,35,.2);border:1px solid rgba(245,166,35,.4);border-radius:8px;padding:6px 12px;text-align:center;">
          <div style="font-size:16px;font-weight:900;color:var(--gold);">${todayClasses.length}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.5);">Lớp hôm nay</div>
        </div>
        ${unpaidCount > 0 ? `
        <div style="background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);border-radius:8px;padding:6px 12px;text-align:center;">
          <div style="font-size:16px;font-weight:900;color:#ef4444;">${unpaidCount}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.5);">Chưa đóng phí</div>
        </div>` : ''}
      </div>
    </div>
    ${todayClasses.length ? `
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
      ${todayClasses.map(c => `
        <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;min-width:160px;flex-shrink:0;">
          <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:4px;">${c.name}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);">🕐 ${c.start}${c.end ? ' – ' + c.end : ''}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);">👩‍🏫 ${c.teacher}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);">👥 ${c.students} HV</div>
        </div>
      `).join('')}
    </div>` : '<div style="font-size:12px;color:rgba(255,255,255,.4);text-align:center;padding:8px;">Hôm nay không có lớp học</div>'}
  `;
  statsGrid.parentNode.insertBefore(widget, statsGrid);

  // ── KPI WIDGET ──
  const m = now.getMonth() + 1, y = now.getFullYear();
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;

  const thisMonthRev = (students || []).filter(s => {
    if (!s.paydate || s.payment === 'Chưa Thanh Toán') return false;
    const d = new Date(s.paydate);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }).reduce((a, s) => a + Number(s.amount || 0), 0);

  const lastMonthRev = (students || []).filter(s => {
    if (!s.paydate || s.payment === 'Chưa Thanh Toán') return false;
    const d = new Date(s.paydate);
    return d.getFullYear() === prevY && (d.getMonth() + 1) === prevM;
  }).reduce((a, s) => a + Number(s.amount || 0), 0);

  const revChange = lastMonthRev > 0 ? Math.round((thisMonthRev - lastMonthRev) / lastMonthRev * 100) : (thisMonthRev > 0 ? 100 : 0);

  // New students this month vs last month
  const thisMonthNew = (students || []).filter(s => {
    if (!s.start) return false;
    const d = new Date(s.start);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }).length;

  const lastMonthNew = (students || []).filter(s => {
    if (!s.start) return false;
    const d = new Date(s.start);
    return d.getFullYear() === prevY && (d.getMonth() + 1) === prevM;
  }).length;

  const newChange = lastMonthNew > 0 ? Math.round((thisMonthNew - lastMonthNew) / lastMonthNew * 100) : (thisMonthNew > 0 ? 100 : 0);

  const kpi = document.createElement('div');
  kpi.id = 'dash-kpi-widget';
  kpi.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;';
  kpi.innerHTML = `
    <div class="card" style="padding:16px;margin:0;">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">💰 DOANH THU SO THÁNG TRƯỚC</div>
      <div style="font-size:20px;font-weight:900;color:var(--navy);">${fmt(thisMonthRev)}</div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
        <span style="font-size:12px;color:${revChange >= 0 ? '#22c55e' : '#ef4444'};font-weight:800;">
          ${revChange >= 0 ? '▲' : '▼'} ${Math.abs(revChange)}%
        </span>
        <span style="font-size:10px;color:var(--muted);">vs T${prevM}</span>
      </div>
    </div>
    <div class="card" style="padding:16px;margin:0;">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">👥 HV MỚI SO THÁNG TRƯỚC</div>
      <div style="font-size:20px;font-weight:900;color:var(--navy);">${thisMonthNew} <span style="font-size:12px;color:var(--muted);">học viên</span></div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
        <span style="font-size:12px;color:${newChange >= 0 ? '#22c55e' : '#ef4444'};font-weight:800;">
          ${newChange >= 0 ? '▲' : '▼'} ${Math.abs(newChange)}%
        </span>
        <span style="font-size:10px;color:var(--muted);">vs T${prevM} (${lastMonthNew} HV)</span>
      </div>
    </div>
  `;
  const chartsRow = document.getElementById('dash-charts-row');
  if (chartsRow) chartsRow.parentNode.insertBefore(kpi, chartsRow);
}


// ════════════════════════════════════════
// SECTION 3: HOLIDAY MANAGEMENT
// ════════════════════════════════════════

let _holidays = [];

async function loadHolidays(year) {
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch(`/api/holidays?year=${year || new Date().getFullYear()}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.ok) _holidays = await resp.json();
  } catch (e) { console.error('Load holidays:', e); }
}

let _currentHolidayDate = new Date();

async function renderHolidaysPage(yearDelta = 0, monthDelta = 0) {
  // Show page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-holidays');
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if ((n.getAttribute('onclick') || '').includes("'holidays'")) n.classList.add('active');
  });

  const content = document.getElementById('holidays-content');
  if (!content) return;

  _currentHolidayDate.setMonth(_currentHolidayDate.getMonth() + monthDelta);
  _currentHolidayDate.setFullYear(_currentHolidayDate.getFullYear() + yearDelta);

  const year = _currentHolidayDate.getFullYear();
  const month = _currentHolidayDate.getMonth();

  await loadHolidays(year);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const today = (now.getFullYear() === year && now.getMonth() === month) ? now.getDate() : -1;

  const holidayDates = new Set(_holidays.map(h => h.date));
  const dayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  let calHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <button onclick="renderHolidaysPage(0, -1)" style="padding:6px 12px;border-radius:8px;border:1px solid var(--cream2);background:#fff;cursor:pointer;">◀ Tháng trước</button>
      <div style="font-size:18px;font-weight:800;color:var(--navy);">Tháng ${month + 1} / ${year}</div>
      <button onclick="renderHolidaysPage(0, 1)" style="padding:6px 12px;border-radius:8px;border:1px solid var(--cream2);background:#fff;cursor:pointer;">Tháng sau ▶</button>
    </div>
    <div class="holiday-cal">
  `;
  dayHeaders.forEach(d => { calHTML += `<div class="hc-header">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) calHTML += '<div class="hc-day" style="background:transparent;border:none;"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(year, month, d).getDay();
    const isHoliday = holidayDates.has(ds);
    const isToday = d === today;
    const isSunday = dow === 0;
    const cls = [isToday ? 'today' : '', isHoliday ? 'holiday' : '', isSunday && !isToday ? 'sunday' : ''].filter(Boolean).join(' ');
    const hName = _holidays.find(h => h.date === ds);
    calHTML += `<div class="hc-day ${cls}" title="${hName ? hName.name : ''}">${d}</div>`;
  }
  calHTML += '</div>';

  const typeLabel = { fixed: '🏛 Ngày Lễ', tet: '🧧 Tết', custom: '📝 Nghỉ Đột Xuất' };
  const typeColor = { fixed: '#3b82f6', tet: '#ef4444', custom: '#f59e0b' };

  const listHTML = _holidays.sort((a, b) => a.date < b.date ? -1 : 1).map(h => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--bg);transition:background .12s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <div style="width:8px;height:8px;border-radius:50%;background:${typeColor[h.type] || '#94a3b8'};flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:var(--ink);">${h.name}</div>
        <div style="font-size:11px;color:var(--muted);">${fmtDate(h.date)} · ${typeLabel[h.type] || h.type}</div>
      </div>
      ${h.type === 'custom' ? `<button onclick="deleteHoliday('${h.id}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;" title="Xóa">✕</button>` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="holiday-layout">
      <div class="card" style="margin:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div class="card-title">${['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'][month]} ${year}</div>
        </div>
        ${calHTML}
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--muted);">
            <div style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,var(--gold),var(--gold-2));"></div> Hôm nay
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--muted);">
            <div style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,#fee2e2,#fecaca);border:1px solid #fca5a5;"></div> Ngày nghỉ
          </div>
        </div>
      </div>

      <div>
        <div class="card" id="holiday-add-form" style="margin:0 0 14px 0;">
          <div class="card-title" style="margin-bottom:12px;">Thêm Ngày Nghỉ Đột Xuất</div>
          <div style="display:grid;gap:10px;">
            <input type="text" id="hol-name" placeholder="Lý do nghỉ (VD: Bão số 3)" style="border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:10px;font-weight:700;color:var(--muted);display:block;margin-bottom:3px;">Từ ngày</label>
                <input type="date" id="hol-start" style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
              </div>
              <div>
                <label style="font-size:10px;font-weight:700;color:var(--muted);display:block;margin-bottom:3px;">Đến ngày</label>
                <input type="date" id="hol-end" style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
              </div>
            </div>
            <textarea id="hol-note" placeholder="Ghi chú thêm (tùy chọn)" rows="2" style="border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;resize:vertical;box-sizing:border-box;"></textarea>
            <button onclick="addCustomHoliday()" class="btn btn-gold" style="width:100%;">📅 Thêm Ngày Nghỉ</button>
          </div>
        </div>

        <div class="card" style="margin:0;">
          <div class="card-title" style="margin-bottom:10px;">Danh Sách Ngày Nghỉ ${year} (${_holidays.length})</div>
          <div style="max-height:300px;overflow-y:auto;">
            ${listHTML || '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">Chưa có ngày nghỉ nào</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function addCustomHoliday() {
  const name = document.getElementById('hol-name')?.value?.trim();
  const start = document.getElementById('hol-start')?.value;
  const end = document.getElementById('hol-end')?.value;
  const note = document.getElementById('hol-note')?.value?.trim();

  if (!name || !start) { showToast('Vui lòng nhập lý do và ngày bắt đầu!'); return; }

  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: start, endDate: end || start, name, note })
    });
    const data = await resp.json();
    if (resp.ok) {
      showToast(`Đã thêm ${data.count || 1} ngày nghỉ!`);
      renderHolidaysPage();
    } else {
      showToast(data.error || 'Lỗi!');
    }
  } catch (e) { showToast('Lỗi kết nối server'); }
}

async function deleteHoliday(id) {
  if (!confirm('Xóa ngày nghỉ này?')) return;
  try {
    const token = localStorage.getItem('vs_token');
    await fetch('/api/holidays/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    showToast('Đã xóa');
    renderHolidaysPage();
  } catch (e) { showToast('Lỗi'); }
}


// ════════════════════════════════════════
// SECTION 4: VIETQR GENERATOR
// ════════════════════════════════════════

async function showVietQR(studentId) {
  const s = (students || []).find(x => x.id === studentId);
  if (!s) return;

  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/vietqr', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: s.amount || 0, studentCode: s.vsId || '', note: `HP_${s.name}` })
    });
    const data = await resp.json();
    if (!resp.ok) { showToast(data.error || 'Lỗi'); return; }

    let m = document.getElementById('vietqr-modal');
    if (!m) { m = document.createElement('div'); m.id = 'vietqr-modal'; document.body.appendChild(m); }
    m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    m.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:380px;width:100%;text-align:center;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.3);">
        <button onclick="document.getElementById('vietqr-modal').style.display='none'" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;">✕</button>
        <div style="font-size:16px;font-weight:900;color:var(--navy);margin-bottom:4px;">💸 Thanh Toán QR</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:16px;">${s.name} – ${s.subject || ''}</div>
        <img src="${data.qrUrl}" alt="VietQR" style="width:240px;height:240px;border-radius:12px;border:2px solid var(--cream2);margin-bottom:14px;" crossorigin="anonymous">
        <div style="background:var(--cream);border-radius:10px;padding:12px;margin-bottom:14px;text-align:left;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);">Số tiền:</span><span style="font-weight:800;color:var(--navy);">${fmt(data.amount)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);">STK:</span><span style="font-weight:600;color:var(--navy);">${data.bank?.account || ''}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--muted);">Chủ TK:</span><span style="font-weight:600;color:var(--navy);">${data.bank?.name || ''}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--muted);">Nội dung:</span><span style="font-weight:600;color:var(--navy);font-size:11px;">${data.addInfo}</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button onclick="downloadQR('${data.qrUrl}')" style="background:var(--navy);color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📥 Tải QR</button>
          <button onclick="markPaidQR(${s.id})" class="btn btn-gold" style="font-size:12px;">✅ Đã Thanh Toán</button>
        </div>
      </div>
    `;
    m.style.display = 'flex';
  } catch (e) { showToast('Lỗi kết nối'); }
}

function downloadQR(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vietqr_payment.jpg';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function markPaidQR(studentId) {
  const s = (students || []).find(x => x.id === studentId);
  if (!s) return;
  s.payment = 'Đã Chuyển Khoản';
  s.paydate = new Date().toISOString().slice(0, 10);
  await saveData();
  showToast('Đã cập nhật trạng thái thanh toán!');
  document.getElementById('vietqr-modal').style.display = 'none';
  updateNotiBadge();
}


// ════════════════════════════════════════
// SECTION 5: IMPORT EXCEL HỌC VIÊN
// ════════════════════════════════════════

let _importData = [];

function addImportExcelButton() {
  // Find toolbar on student page
  const toolbar = document.querySelector('#page-students .toolbar, #page-students .section-row');
  if (!toolbar) return;
  if (document.getElementById('btn-import-excel')) return;

  const btn = document.createElement('button');
  btn.id = 'btn-import-excel';
  btn.className = 'btn btn-outline vs-hide-teacher';
  btn.innerHTML = '📥 Import Excel';
  btn.style.cssText = 'font-size:11px;padding:6px 12px;margin-left:6px;';
  btn.onclick = openImportExcel;
  toolbar.appendChild(btn);
}

function openImportExcel() {
  let m = document.getElementById('import-excel-modal');
  if (!m) { m = document.createElement('div'); m.id = 'import-excel-modal'; document.body.appendChild(m); }
  m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:680px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:85vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:900;color:var(--navy);">📥 Import Học Viên Từ Excel</div>
        <button onclick="document.getElementById('import-excel-modal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;">✕</button>
      </div>
      <div style="background:var(--cream);border:2px dashed var(--cream2);border-radius:14px;padding:30px;text-align:center;margin-bottom:16px;cursor:pointer;" onclick="document.getElementById('import-file-input').click()">
        <div style="font-size:32px;margin-bottom:8px;">📄</div>
        <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:4px;">Kéo thả file hoặc click để chọn</div>
        <div style="font-size:11px;color:var(--muted);">Hỗ trợ: .xlsx, .xls, .csv</div>
        <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv" style="display:none;" onchange="parseImportFile(this)">
      </div>
      <div id="import-preview" style="display:none;">
        <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">📋 Xem Trước Dữ Liệu</div>
        <div id="import-preview-table" style="overflow-x:auto;margin-bottom:14px;"></div>
        <div id="import-mapping" style="margin-bottom:14px;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button onclick="submitImport()" class="btn btn-gold">✅ Import Tất Cả</button>
          <button onclick="document.getElementById('import-excel-modal').style.display='none'" style="border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
        </div>
      </div>
    </div>
  `;
  m.style.display = 'flex';
}

function parseImportFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!json.length) { showToast('File trống!'); return; }

      _importData = json;

      // Preview first 5 rows
      const headers = Object.keys(json[0]);
      let table = '<table style="width:100%;font-size:11px;border-collapse:collapse;"><thead><tr>';
      headers.forEach(h => { table += `<th style="background:var(--navy);color:#fff;padding:6px 8px;text-align:left;white-space:nowrap;">${h}</th>`; });
      table += '</tr></thead><tbody>';
      json.slice(0, 5).forEach(row => {
        table += '<tr>';
        headers.forEach(h => { table += `<td style="padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;">${row[h] || ''}</td>`; });
        table += '</tr>';
      });
      table += '</tbody></table>';
      if (json.length > 5) table += `<div style="font-size:11px;color:var(--muted);margin-top:6px;">... và ${json.length - 5} dòng nữa (tổng: ${json.length})</div>`;

      document.getElementById('import-preview-table').innerHTML = table;

      // Column mapping
      const fields = [
        { key: 'name', label: 'Họ Tên *', guess: ['tên', 'họ tên', 'name', 'ho ten', 'hovaten'] },
        { key: 'phone', label: 'SĐT *', guess: ['sđt', 'sdt', 'phone', 'điện thoại', 'số điện thoại', 'dien thoai'] },
        { key: 'parent', label: 'Phụ Huynh', guess: ['phụ huynh', 'phu huynh', 'parent'] },
        { key: 'subject', label: 'Môn Học', guess: ['môn', 'mon', 'subject', 'môn học'] },
        { key: 'start', label: 'Ngày BD', guess: ['ngày bd', 'start', 'bắt đầu', 'bat dau', 'ngày bắt đầu'] },
        { key: 'amount', label: 'Số Tiền', guess: ['tiền', 'số tiền', 'amount', 'học phí', 'so tien'] },
        { key: 'payment', label: 'HT Thanh Toán', guess: ['thanh toán', 'payment', 'hình thức', 'hinh thuc'] },
      ];

      let mappingHTML = '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:8px;">🔗 Ánh Xạ Cột</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
      fields.forEach(f => {
        // Auto-guess
        const matched = headers.find(h => f.guess.some(g => h.toLowerCase().includes(g)));
        mappingHTML += `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:11px;color:var(--muted);min-width:90px;">${f.label}:</span>
            <select id="map-${f.key}" style="flex:1;border:1px solid #e0e0e0;border-radius:6px;padding:5px;font-size:11px;font-family:'Be Vietnam Pro',sans-serif;">
              <option value="">— Bỏ qua —</option>
              ${headers.map(h => `<option value="${h}" ${h === matched ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
          </div>`;
      });
      mappingHTML += '</div>';
      document.getElementById('import-mapping').innerHTML = mappingHTML;

      document.getElementById('import-preview').style.display = '';
    } catch (err) {
      showToast('Lỗi đọc file: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function submitImport() {
  if (!_importData.length) return;

  const getMap = key => document.getElementById('map-' + key)?.value || '';
  const nameCol = getMap('name');
  const phoneCol = getMap('phone');

  if (!nameCol || !phoneCol) {
    showToast('Vui lòng chọn cột Họ Tên và SĐT!');
    return;
  }

  const rows = _importData.map(row => ({
    name: String(row[nameCol] || '').trim(),
    phone: String(row[phoneCol] || '').trim(),
    parent: String(row[getMap('parent')] || '').trim(),
    subject: String(row[getMap('subject')] || '').trim(),
    start: parseExcelDate(row[getMap('start')]),
    amount: Number(String(row[getMap('amount')] || '0').replace(/[^\d]/g, '')) || 0,
    payment: String(row[getMap('payment')] || 'Chưa Thanh Toán').trim(),
  }));

  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/import-students', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    const data = await resp.json();
    if (resp.ok) {
      showToast(`✅ Import thành công: ${data.added} thêm, ${data.skipped} bỏ qua`);
      document.getElementById('import-excel-modal').style.display = 'none';
      // Reload data
      location.reload();
    } else {
      showToast(data.error || 'Lỗi import!');
    }
  } catch (e) { showToast('Lỗi kết nối server'); }
}

function parseExcelDate(val) {
  if (!val) return '';
  // If number (Excel serial date)
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  // If DD/MM/YYYY
  const parts = String(val).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (parts) return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return '';
}


// ════════════════════════════════════════
// SECTION 6: MOBILE SIDEBAR TOGGLE
// ════════════════════════════════════════

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('mobile-open');
  if (isOpen) {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  } else {
    sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
  }
}

function initMobileSidebar() {
  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });
}


// ════════════════════════════════════════
// SECTION 7: DARK MODE ENHANCEMENT
// ════════════════════════════════════════

function fixDarkMode() {
  // Restore dark mode on load
  const isDark = localStorage.getItem('vs_dark') === '1';
  if (isDark) {
    document.body.classList.add('dark-mode');
  }
}


// ════════════════════════════════════════
// SECTION 8: REPORT PAGE UPGRADE (Chart.js)
// ════════════════════════════════════════

let _reportRevChart = null;
let _reportSubjectChart = null;
let _reportPaymentChart = null;

function renderReportPageV5() {
  const content = document.getElementById('report-content');
  if (!content) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  // Calculate stats
  const totalStudents = students.length;
  const thisMonthRev = (students || []).filter(s => {
    if (!s.paydate || s.payment === 'Chưa Thanh Toán') return false;
    const d = new Date(s.paydate);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }).reduce((a, s) => a + Number(s.amount || 0), 0);

  // Lead conversion rate
  const convertedLeads = (leads || []).filter(l => l.status === 'Đã Đăng Ký' || l.status === 'Thành Công').length;
  const totalLeads = (leads || []).length;
  const convRate = totalLeads > 0 ? Math.round(convertedLeads / totalLeads * 100) : 0;

  // Sessions this month
  const thisMonthAtt = (attendance || []).filter(a => {
    if (!a.date) return false;
    const d = new Date(a.date);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }).length;

  // Monthly revenue for 6 months
  const months6 = [];
  const values6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const mm = d.getMonth() + 1, yy = d.getFullYear();
    months6.push(`T${mm}`);
    values6.push((students || []).filter(s => {
      if (!s.paydate || s.payment === 'Chưa Thanh Toán') return false;
      const pd = new Date(s.paydate);
      return pd.getFullYear() === yy && (pd.getMonth() + 1) === mm;
    }).reduce((a, s) => a + Number(s.amount || 0), 0));
  }

  // Subject breakdown
  const bySub = {};
  students.forEach(s => { const k = s.subject || 'Khác'; bySub[k] = (bySub[k] || 0) + 1; });
  const subEntries = Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Payment breakdown
  const paymentData = {
    'Đã Chuyển Khoản': students.filter(s => s.payment === 'Đã Chuyển Khoản').length,
    'Tiền Mặt': students.filter(s => s.payment === 'Tiền Mặt').length,
    'Chưa Thanh Toán': students.filter(s => s.payment === 'Chưa Thanh Toán').length,
  };

  // New students this month
  const newThisMonth = students.filter(s => {
    if (!s.start) return false;
    const d = new Date(s.start);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  });

  // Expiring ≤ 14 days
  const expiringSoon = students.filter(s => {
    if (!s.end) return false;
    const d = Math.ceil((new Date(s.end) - now) / (1000 * 60 * 60 * 24));
    return d >= 0 && d <= 14;
  });

  content.innerHTML = `
    <!-- Stats Row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:18px;">
      <div class="stat-card"><div class="stat-value">${totalStudents}</div><div class="stat-label">Tổng Học Viên</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--gold);font-size:16px;">${fmt(thisMonthRev)}</div><div class="stat-label">Doanh Thu T${m}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#3b82f6">${convRate}%</div><div class="stat-label">Chuyển Đổi Lead</div></div>
      <div class="stat-card"><div class="stat-value">${thisMonthAtt}</div><div class="stat-label">Buổi Học T${m}</div></div>
    </div>

    <!-- Charts Row -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:16px;">
      <div class="card" style="margin:0;">
        <div class="card-title" style="margin-bottom:12px;">📊 Doanh Thu 6 Tháng Gần Nhất</div>
        <div style="height:220px;position:relative;"><canvas id="report-rev-chart"></canvas></div>
      </div>
      <div class="card" style="margin:0;">
        <div class="card-title" style="margin-bottom:12px;">🎵 Top Môn Học</div>
        <div style="height:220px;position:relative;"><canvas id="report-subject-chart"></canvas></div>
      </div>
    </div>

    <!-- Tables Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div class="card" style="margin:0;">
        <div class="card-title" style="margin-bottom:10px;">🆕 HV Mới Trong Tháng (${newThisMonth.length})</div>
        <div class="table-wrap" style="max-height:220px;overflow-y:auto;">
          <table>
            <thead><tr><th>Họ Tên</th><th>Môn</th><th>Ngày BD</th></tr></thead>
            <tbody>
              ${newThisMonth.length ? newThisMonth.map(s => `
                <tr onclick="openStudentProfile(${s.id})" style="cursor:pointer;">
                  <td style="font-weight:600;">${s.name}</td>
                  <td>${s.subject || '–'}</td>
                  <td>${fmtDate(s.start)}</td>
                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px;">Chưa có HV mới</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin:0;">
        <div class="card-title" style="margin-bottom:10px;">⏰ Sắp Hết Khóa ≤14 Ngày (${expiringSoon.length})</div>
        <div class="table-wrap" style="max-height:220px;overflow-y:auto;">
          <table>
            <thead><tr><th>Họ Tên</th><th>Môn</th><th>Hết Khóa</th><th>Còn</th></tr></thead>
            <tbody>
              ${expiringSoon.length ? expiringSoon.map(s => {
    const d = Math.ceil((new Date(s.end) - now) / (1000 * 60 * 60 * 24));
    return `
                <tr onclick="openStudentProfile(${s.id})" style="cursor:pointer;">
                  <td style="font-weight:600;">${s.name}</td>
                  <td>${s.subject || '–'}</td>
                  <td>${fmtDate(s.end)}</td>
                  <td><span style="background:${d <= 3 ? '#fee2e2' : '#fef9c3'};color:${d <= 3 ? '#dc2626' : '#92400e'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${d}ng</span></td>
                </tr>`;
  }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px;">Không có</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Payment Chart -->
    <div class="card" style="margin:0;">
      <div class="card-title" style="margin-bottom:10px;">💳 Tỷ Lệ Thanh Toán</div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center;">
        <div style="position:relative;"><canvas id="report-payment-chart"></canvas></div>
        <div>
          ${Object.entries(paymentData).map(([k, v]) => {
    const color = k.includes('Chuyển') ? '#3b82f6' : k.includes('Mặt') ? '#22c55e' : '#ef4444';
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="width:12px;height:12px;border-radius:3px;background:${color};flex-shrink:0;"></div>
            <span style="font-size:12px;font-weight:600;color:var(--ink);">${k}</span>
            <span style="font-size:12px;color:var(--muted);margin-left:auto;">${v} HV (${totalStudents ? Math.round(v / totalStudents * 100) : 0}%)</span>
          </div>`;
  }).join('')}
        </div>
      </div>
    </div>
  `;

  // Render Chart.js charts
  setTimeout(() => {
    // Revenue bar chart
    const revCtx = document.getElementById('report-rev-chart');
    if (revCtx && typeof Chart !== 'undefined') {
      if (_reportRevChart) _reportRevChart.destroy();
      _reportRevChart = new Chart(revCtx, {
        type: 'bar',
        data: {
          labels: months6,
          datasets: [{
            label: 'Doanh Thu',
            data: values6,
            backgroundColor: months6.map((_, i) => i === 5 ? '#F5A623' : '#93c5fd'),
            borderRadius: 6,
            barThickness: 28,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => (v / 1000000).toFixed(1) + 'tr', font: { size: 10 } },
              grid: { color: 'rgba(0,0,0,.05)' }
            },
            x: { ticks: { font: { size: 11, weight: 'bold' } }, grid: { display: false } }
          }
        }
      });
    }

    // Subject doughnut
    const subCtx = document.getElementById('report-subject-chart');
    if (subCtx && typeof Chart !== 'undefined') {
      if (_reportSubjectChart) _reportSubjectChart.destroy();
      const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#14b8a6'];
      _reportSubjectChart = new Chart(subCtx, {
        type: 'doughnut',
        data: {
          labels: subEntries.map(e => e[0]),
          datasets: [{
            data: subEntries.map(e => e[1]),
            backgroundColor: colors.slice(0, subEntries.length),
            borderWidth: 2,
            borderColor: '#fff',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8, boxWidth: 12 } }
          },
          cutout: '55%',
        }
      });
    }

    // Payment pie
    const payCtx = document.getElementById('report-payment-chart');
    if (payCtx && typeof Chart !== 'undefined') {
      if (_reportPaymentChart) _reportPaymentChart.destroy();
      _reportPaymentChart = new Chart(payCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(paymentData),
          datasets: [{
            data: Object.values(paymentData),
            backgroundColor: ['#3b82f6', '#22c55e', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          cutout: '60%',
        }
      });
    }
  }, 50);
}


// ════════════════════════════════════════
// SECTION 9: CARE PAGE SERVER-BACKED LOG
// ════════════════════════════════════════

// Enhance the existing care log save to also use server API
const _origSaveContactLog = window.saveContactLog;
window.saveContactLog = async function () {
  const sid = Number(document.getElementById('cl-student')?.value);
  const type = document.getElementById('cl-type')?.value || 'Gọi điện';
  const note = document.getElementById('cl-note')?.value || '';
  const result = document.getElementById('cl-result')?.value || '';

  // Also save to server API
  try {
    const token = localStorage.getItem('vs_token');
    await fetch(`/api/student/${sid}/care-log`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, result, note })
    });
  } catch (e) { console.log('Care log server save:', e.message); }

  // Call original handler
  if (typeof _origSaveContactLog === 'function') _origSaveContactLog();
};


// ════════════════════════════════════════
// SECTION 10: STUDENT PROFILE PAYMENT TAB
// ════════════════════════════════════════

// Enhance student profile with VietQR + payment history buttons
const _origOpenProfileV5 = window.openStudentProfile;
window.openStudentProfile = function (studentId) {
  // Call original
  if (typeof _origOpenProfileV5 === 'function') _origOpenProfileV5(studentId);

  // Add VietQR and Renewal buttons after modal renders
  setTimeout(() => {
    const modal = document.getElementById('student-profile-modal');
    if (!modal) return;

    // Find the button area in header
    const headerBtns = modal.querySelector('[style*="display:flex"][style*="gap:8px"][style*="align-items:center"]');
    if (headerBtns && !headerBtns.querySelector('#sp-qr-btn')) {
      const qrBtn = document.createElement('button');
      qrBtn.id = 'sp-qr-btn';
      qrBtn.innerHTML = '💸 QR';
      qrBtn.style.cssText = 'background:rgba(245,166,35,.2);color:var(--gold);border:1px solid rgba(245,166,35,.4);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
      qrBtn.onclick = () => showVietQR(studentId);
      headerBtns.insertBefore(qrBtn, headerBtns.firstChild);

      const renewBtn = document.createElement('button');
      renewBtn.innerHTML = '🔄 Gia Hạn';
      renewBtn.style.cssText = 'background:rgba(34,197,94,.15);color:#16a34a;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
      renewBtn.onclick = () => { modal.style.display = 'none'; openRenewalModal(studentId); };
      headerBtns.insertBefore(renewBtn, headerBtns.firstChild);
    }
  }, 100);
};


// ════════════════════════════════════════
// HOOKS & INITIALIZATION
// ════════════════════════════════════════


// Patch initAppAfterLogin
const _origInitV5 = window.initAppAfterLogin;
window.initAppAfterLogin = async function () {
  if (typeof _origInitV5 === 'function') _origInitV5();

  // Init notification system
  setTimeout(initNotiSystem, 1000);

  // Init mobile sidebar
  setTimeout(initMobileSidebar, 200);

  // Fix dark mode
  setTimeout(fixDarkMode, 100);

  // Add Import Excel button to student page
  setTimeout(addImportExcelButton, 500);

  // Dashboard extras (only for admin/staff)
  if (['admin', 'staff'].includes(window.VS_ROLE)) {
    setTimeout(initDashboardExtras, 600);
  }
};


// ════════════════════════════════════════
// SECTION 11: NEWS / BẢNG TIN
// ════════════════════════════════════════

let _newsData = [];
let _editingNewsId = null;

async function loadNews() {
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/news', { headers: { 'Authorization': 'Bearer ' + token } });
    if (resp.ok) _newsData = await resp.json();
  } catch (e) { console.log('Load news:', e.message); }
}



window._currentNewsTab = window._currentNewsTab || 'Tất cả';

window.setNewsTab = function(tabName) {
  window._currentNewsTab = tabName;
  renderNewsPage();
};

window.nextNewsSlide = function(e, newsId) {
  e.stopPropagation();
  const track = document.getElementById('carousel-track-' + newsId);
  if (!track) return;
  const total = parseInt(track.getAttribute('data-total') || '1');
  let current = parseInt(track.getAttribute('data-current') || '0');
  if (current < total - 1) {
    current++;
    track.setAttribute('data-current', current);
    track.style.transform = `translateX(-${current * 100}%)`;
    updateNewsDots(newsId, current, total);
  }
};

window.prevNewsSlide = function(e, newsId) {
  e.stopPropagation();
  const track = document.getElementById('carousel-track-' + newsId);
  if (!track) return;
  const total = parseInt(track.getAttribute('data-total') || '1');
  let current = parseInt(track.getAttribute('data-current') || '0');
  if (current > 0) {
    current--;
    track.setAttribute('data-current', current);
    track.style.transform = `translateX(-${current * 100}%)`;
    updateNewsDots(newsId, current, total);
  }
};

function updateNewsDots(newsId, current, total) {
  for (let i = 0; i < total; i++) {
    const dot = document.getElementById('dot-' + newsId + '-' + i);
    if (dot) {
      if (i === current) dot.classList.add('active');
      else dot.classList.remove('active');
    }
  }
}

async function renderNewsPage() {
  const content = document.getElementById('news-content');
  if (!content) return;

  await loadNews();
  const isAdmin = window.VS_ROLE === 'admin';
  const isTeacher = window.VS_ROLE === 'teacher';
  
  // Filter by Tab
  let filteredNews = _newsData;
  if (window._currentNewsTab !== 'Tất cả') {
    filteredNews = _newsData.filter(n => n.category === window._currentNewsTab);
  }

  const pinnedNews = filteredNews.filter(n => n.pinned);
  const regularNews = filteredNews.filter(n => !n.pinned);
  const myId = window.VS_USER_ID || 0;

  const tabs = ['Tất cả', 'Thông báo', 'Sự kiện', 'Lịch học', 'Khuyến mãi', 'Khác'];

  const renderIgCard = (n) => {
    // Media section: Carousel
    let mediaItems = [];
    if (n.videoUrl) {
      const embedUrl = n.videoUrl.replace(/(?:v=|youtu\.be\/)([^&]+)/, 'embed/$1').replace('watch?embed/', 'embed/');
      mediaItems.push(`<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`);
    }
    if (n.images && n.images.length) {
      n.images.forEach(img => {
        mediaItems.push(`<img src="${img.startsWith('data:') ? img : img + '?token=' + localStorage.getItem('vs_token')}" alt="News Image" onclick="openMagModal(${n.id})">`);
      });
    }

    let mediaHtml = '';
    if (mediaItems.length > 0) {
      mediaHtml = `
        <div class="ig-carousel-container" id="carousel-${n.id}">
          <div class="ig-carousel-track" id="carousel-track-${n.id}" data-current="0" data-total="${mediaItems.length}">
            ${mediaItems.map(m => `<div class="ig-carousel-slide">${m}</div>`).join('')}
          </div>
          ${mediaItems.length > 1 ? `
            <button class="ig-carousel-btn ig-carousel-prev" onclick="window.prevNewsSlide(event, ${n.id})">❮</button>
            <button class="ig-carousel-btn ig-carousel-next" onclick="window.nextNewsSlide(event, ${n.id})">❯</button>
            <div class="ig-carousel-dots">
              ${mediaItems.map((_, i) => `<div id="dot-${n.id}-${i}" class="ig-carousel-dot ${i===0?'active':''}"></div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      mediaHtml = `<div class="ig-media-placeholder" onclick="openMagModal(${n.id})">Nội dung không có hình ảnh</div>`;
    }

    const likes = n.likes || [];
    const isLiked = likes.includes(myId);
    const comments = n.comments || [];
    const cat = n.category || 'Thông báo';

    return `
      <div class="ig-card ${n.pinned ? 'pinned' : ''}">
        <div class="ig-card-header">
          <div class="ig-header-left">
            <div class="ig-avatar">${n.author?n.author.charAt(0).toUpperCase():'A'}</div>
            <div class="ig-author-info">
              <span class="ig-author-name">${n.author || 'Admin'}</span>
              <span class="ig-post-date">${timeAgo(n.createdAt)} • ${cat}</span>
            </div>
          </div>
          <div class="ig-header-right">
            ${n.pinned ? '<span class="ig-pin-badge">📌</span>' : ''}
            ${isAdmin ? `
              <button class="ig-action-btn" onclick="openEditNews(${n.id})">✏️</button>
              <button class="ig-action-btn" onclick="togglePinNews(${n.id}, ${!n.pinned})">${n.pinned ? '📌' : '📌'}</button>
              <button class="ig-action-btn" onclick="deleteNews(${n.id})">🗑️</button>
            ` : ''}
          </div>
        </div>
        
        ${mediaHtml}
        
        ${!isTeacher ? `
        <div class="ig-actions-bar">
          <button class="ig-like-btn ${isLiked ? 'liked' : ''}" onclick="window.toggleNewsLike(${n.id})">
            ${isLiked ? '❤️' : '🤍'}
          </button>
          <button class="ig-comment-btn" onclick="openMagModal(${n.id})">💬</button>
        </div>
        ` : '<div style="height:12px;"></div>'}
        
        ${!isTeacher ? `<div class="ig-likes-count"><strong>${likes.length} lượt thích</strong></div>` : ''}
        
        <div class="ig-caption">
          <strong>${n.title}</strong>
          <div class="ig-caption-text ql-editor" style="padding:0;max-height:100px;overflow:hidden;text-overflow:ellipsis;margin-top:6px;">${n.content}</div>
          <span class="ig-read-more" onclick="openMagModal(${n.id})">Xem thêm...</span>
        </div>
        
        ${(!isTeacher && comments.length > 0) ? `
        <div class="ig-comments-preview" onclick="openMagModal(${n.id})">
          Xem tất cả ${comments.length} bình luận
        </div>
        ` : ''}
      </div>
    `;
  };

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;max-width:650px;margin-left:auto;margin-right:auto;">
      <div class="ig-tabs">
        ${tabs.map(t => `
          <button class="ig-tab ${t === window._currentNewsTab ? 'active' : ''}" onclick="setNewsTab('${t}')">${t}</button>
        `).join('')}
      </div>
      ${isAdmin ? `
      <button onclick="openCreateNews()" class="btn btn-gold" style="border-radius:24px;padding:8px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);flex-shrink:0;margin-left:16px;">✍ Viết Bài Mới</button>
      ` : ''}
    </div>
    
    <div class="ig-feed-container">
      ${pinnedNews.length ? pinnedNews.map(renderIgCard).join('') : ''}
      ${regularNews.length ? regularNews.map(renderIgCard).join('') : ''}

      ${!filteredNews.length ? `
      <div style="text-align:center;padding:60px 20px;background:#fff;border-radius:16px;max-width:650px;margin:0 auto;border:1px solid #eee;">
        <div style="font-size:48px;margin-bottom:12px;">📰</div>
        <div style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:6px;">Không có bài viết nào</div>
        <div style="font-size:13px;color:var(--muted);">Chưa có tin tức nào trong chuyên mục này.</div>
      </div>` : ''}
    </div>
  `;
}

// Modal xem chi tiết bài viết
window.openMagModal = function(newsId) {
  const n = _newsData.find(x => x.id == newsId);
  if (!n) return;

  const isTeacher = window.VS_ROLE === 'teacher';
  let m = document.getElementById('mag-news-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'mag-news-modal';
    m.className = 'mag-modal-overlay';
    document.body.appendChild(m);
  }

  const comments = n.comments || [];
  const likes = n.likes || [];
  const myId = window.VS_USER_ID || 0;
  const isLiked = likes.includes(myId);

  // Modal media using Carousel as well
  let mediaItems = [];
  if (n.videoUrl) {
    const embedUrl = n.videoUrl.replace(/(?:v=|youtu\.be\/)([^&]+)/, 'embed/$1').replace('watch?embed/', 'embed/');
    mediaItems.push(`<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`);
  }
  if (n.images && n.images.length) {
    n.images.forEach(img => {
      mediaItems.push(`<img src="${img.startsWith('data:') ? img : img + '?token=' + localStorage.getItem('vs_token')}" alt="Image">`);
    });
  }

  let mediaHtml = '';
  if (mediaItems.length > 0) {
    mediaHtml = `
      <div class="ig-carousel-container" style="height:100%;max-height:100%;border:none;">
        <div class="ig-carousel-track" id="modal-carousel-track-${n.id}" data-current="0" data-total="${mediaItems.length}">
          ${mediaItems.map(m => `<div class="ig-carousel-slide">${m}</div>`).join('')}
        </div>
        ${mediaItems.length > 1 ? `
          <button class="ig-carousel-btn ig-carousel-prev" onclick="window.prevModalSlide(event, ${n.id})" style="background:rgba(255,255,255,0.4);">❮</button>
          <button class="ig-carousel-btn ig-carousel-next" onclick="window.nextModalSlide(event, ${n.id})" style="background:rgba(255,255,255,0.4);">❯</button>
          <div class="ig-carousel-dots">
            ${mediaItems.map((_, i) => `<div id="modal-dot-${n.id}-${i}" class="ig-carousel-dot ${i===0?'active':''}"></div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  } else {
    mediaHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#111;color:#868e96;">Không có hình ảnh</div>`;
  }

  m.innerHTML = `
    <div class="mag-modal-content">
      <button class="mag-modal-close" onclick="document.getElementById('mag-news-modal').style.display='none'">✕</button>
      
      <div class="mag-modal-left">
        ${mediaHtml}
      </div>
      
      <div class="mag-modal-right">
        <div class="mag-right-header">
          <div class="ig-avatar">${n.author?n.author.charAt(0).toUpperCase():'A'}</div>
          <div style="font-weight:700;font-size:14px;color:var(--navy);">${n.author || 'Admin'}</div>
        </div>
        
        <div class="mag-right-body">
          <div style="margin-bottom:16px;">
            <div class="ig-avatar" style="width:28px;height:28px;font-size:12px;float:left;margin-right:12px;margin-top:2px;">${n.author?n.author.charAt(0).toUpperCase():'A'}</div>
            <div style="overflow:hidden;">
              <strong style="color:var(--navy);font-size:14px;margin-right:8px;">${n.author || 'Admin'}</strong>
              <span style="font-size:14px;color:#262626;white-space:pre-wrap;">${n.title}</span>
              <div class="ql-editor" style="padding:0;margin-top:8px;font-size:14px;color:#262626;">${n.content}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:8px;">${timeAgo(n.createdAt)}</div>
            </div>
          </div>
          
          ${!isTeacher ? `
            <div style="border-top:1px solid #efefef;padding-top:16px;margin-top:16px;">
              ${comments.map(c => `
                <div style="margin-bottom:12px;display:flex;">
                  <div class="ig-avatar" style="width:28px;height:28px;font-size:12px;margin-right:12px;flex-shrink:0;">${c.displayName?c.displayName.charAt(0).toUpperCase():'U'}</div>
                  <div>
                    <strong style="font-size:13px;color:var(--navy);margin-right:6px;">${c.displayName}</strong>
                    <span style="font-size:13px;color:#262626;">${c.content}</span>
                    <div style="font-size:11px;color:var(--muted);margin-top:4px;">${timeAgo(c.createdAt)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div style="font-size:13px;color:#888;font-style:italic;text-align:center;margin-top:20px;">Giáo viên chỉ có quyền xem nội dung.</div>'}
        </div>
        
        ${!isTeacher ? `
        <div class="mag-right-footer">
          <div style="display:flex;gap:16px;margin-bottom:8px;">
            <button class="ig-like-btn ${isLiked ? 'liked' : ''}" onclick="window.toggleNewsLike(${n.id}); setTimeout(()=>openMagModal(${n.id}), 300)">
              ${isLiked ? '❤️' : '🤍'}
            </button>
          </div>
          <div style="font-weight:600;font-size:14px;color:var(--navy);margin-bottom:4px;">${likes.length} lượt thích</div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:12px;text-transform:uppercase;">${timeAgo(n.createdAt)}</div>
          
          <div style="display:flex;align-items:center;border-top:1px solid #efefef;padding-top:12px;">
            <input type="text" id="mag-comment-input" placeholder="Thêm bình luận..." style="flex:1;border:none;outline:none;font-size:14px;background:transparent;">
            <button onclick="window.submitNewsComment(${n.id})" style="background:transparent;border:none;color:#0095f6;font-weight:600;font-size:14px;cursor:pointer;">Đăng</button>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  m.style.display = 'flex';
};

window.nextModalSlide = function(e, newsId) {
  e.stopPropagation();
  const track = document.getElementById('modal-carousel-track-' + newsId);
  if (!track) return;
  const total = parseInt(track.getAttribute('data-total') || '1');
  let current = parseInt(track.getAttribute('data-current') || '0');
  if (current < total - 1) {
    current++;
    track.setAttribute('data-current', current);
    track.style.transform = `translateX(-${current * 100}%)`;
    updateModalDots(newsId, current, total);
  }
};

window.prevModalSlide = function(e, newsId) {
  e.stopPropagation();
  const track = document.getElementById('modal-carousel-track-' + newsId);
  if (!track) return;
  const total = parseInt(track.getAttribute('data-total') || '1');
  let current = parseInt(track.getAttribute('data-current') || '0');
  if (current > 0) {
    current--;
    track.setAttribute('data-current', current);
    track.style.transform = `translateX(-${current * 100}%)`;
    updateModalDots(newsId, current, total);
  }
};

function updateModalDots(newsId, current, total) {
  for (let i = 0; i < total; i++) {
    const dot = document.getElementById('modal-dot-' + newsId + '-' + i);
    if (dot) {
      if (i === current) dot.classList.add('active');
      else dot.classList.remove('active');
    }
  }
}

window.toggleNewsLike = async function(newsId) {
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch(`/api/news/${newsId}/like`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.ok) {
      const data = await resp.json();
      const n = _newsData.find(x => x.id == newsId);
      if (n) {
        n.likes = data.likes;
        renderNewsPage(); // Re-render feed
      }
    }
  } catch (e) { console.error('Like error', e); }
};

window.submitNewsComment = async function(newsId) {
  const input = document.getElementById('mag-comment-input');
  if (!input || !input.value.trim()) return;
  const content = input.value.trim();
  
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch(`/api/news/${newsId}/comments`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (resp.ok) {
      const newComment = await resp.json();
      const n = _newsData.find(x => x.id == newsId);
      if (n) {
        if (!n.comments) n.comments = [];
        n.comments.push(newComment);
        // Re-render modal to show new comment
        openMagModal(newsId);
        renderNewsPage(); 
      }
    }
  } catch (e) { showToast('Lỗi gửi bình luận'); }
};

function formatNewsContent(text) {
  if (!text) return '';
  // Simple markdown-like: **bold**, *italic*, \n → <br>
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function viewNewsImage(url) {
  let m = document.getElementById('news-img-viewer');
  if (!m) { m = document.createElement('div'); m.id = 'news-img-viewer'; document.body.appendChild(m); }
  m.onclick = () => m.style.display = 'none';
  m.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out;';
  m.innerHTML = `<img src="${url}" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);">`;
}

function openCreateNews() {
  _editingNewsId = null;
  openNewsEditor({ title: '', content: '', category: 'Thông báo', images: [] });
}

function openEditNews(id) {
  const n = _newsData.find(x => x.id === id);
  if (!n) return;
  _editingNewsId = id;
  openNewsEditor(n);
}

function openNewsEditor(data) {
  let m = document.getElementById('news-editor-modal');
  if (!m) { m = document.createElement('div'); m.id = 'news-editor-modal'; document.body.appendChild(m); }
  m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';

  const categories = ['Thông báo', 'Sự kiện', 'Lịch học', 'Khuyến mãi', 'Khác'];

  m.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:640px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="font-size:18px;font-weight:900;color:var(--navy);">${_editingNewsId ? '✏️ Sửa Bài Viết' : '✍ Viết Bài Mới'}</div>
        <button onclick="document.getElementById('news-editor-modal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;">✕</button>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Tiêu đề *</label>
        <input id="ne-title" type="text" value="${data.title || ''}" placeholder="Nhập tiêu đề bài viết..." style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:10px 14px;font-size:14px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Danh mục</label>
        <select id="ne-category" style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:10px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
          ${categories.map(c => `<option ${data.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Nội dung *</label>
        <div id="ne-quill-editor" style="height:250px;font-family:'Be Vietnam Pro',sans-serif;font-size:14px;text-align:left;"></div>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Video URL (YouTube)</label>
        <input id="ne-video-url" type="text" value="${data.videoUrl || ''}" placeholder="Nhập link Youtube (nếu có)" style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:10px 14px;font-size:14px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Hình ảnh</label>
        <div id="ne-images-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          ${(data.images || []).map((url, i) => `
            <div style="position:relative;width:80px;height:80px;">
              <img src="${url.startsWith('data:') ? url : url + '?token=' + localStorage.getItem('vs_token')}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1.5px solid var(--cream2);">
              <button onclick="this.parentElement.remove()" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:1;">✕</button>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="document.getElementById('ne-file-input').click()" style="background:var(--cream);border:1.5px dashed var(--cream2);border-radius:10px;padding:10px 16px;font-size:12px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy);font-weight:600;">📷 Thêm Ảnh</button>
          <input type="file" id="ne-file-input" accept="image/*" multiple style="display:none;" onchange="previewNewsImages(this)">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="submitNewsPost()" class="btn btn-gold">💾 ${_editingNewsId ? 'Cập Nhật' : 'Đăng Bài'}</button>
        <button onclick="document.getElementById('news-editor-modal').style.display='none'" style="border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
      </div>
    </div>
  `;
  m.style.display = 'flex';
  window.quillNewsEditor = new Quill('#ne-quill-editor', { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link']] } });
  window.quillNewsEditor.root.innerHTML = data.content || '';
}

function previewNewsImages(input) {
  const preview = document.getElementById('ne-images-preview');
  if (!preview) return;
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;width:80px;height:80px;';
      div.innerHTML = `
        <img src="${e.target.result}" data-base64="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1.5px solid var(--cream2);">
        <button onclick="this.parentElement.remove()" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:1;">✕</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

async function submitNewsPost() {
  const title = document.getElementById('ne-title').value.trim();
  const category = document.getElementById('ne-category').value;
  const videoUrl = document.getElementById('ne-video-url').value.trim();
  const content = window.quillNewsEditor ? window.quillNewsEditor.root.innerHTML : '';
  if (!title || !content || content === '<p><br></p>') { showToast('Vui lòng nhập đủ!'); return; }

  const images = [];
  document.querySelectorAll('#ne-images-preview img').forEach(img => {
    const b64 = img.dataset.base64;
    if (b64) images.push(b64);
    else images.push(img.getAttribute('src'));
  });

  try {
    const token = localStorage.getItem('vs_token');
    const url = _editingNewsId ? `/api/news/${_editingNewsId}` : '/api/news';
    const method = _editingNewsId ? 'PUT' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, images, videoUrl })
    });

    if (resp.ok) {
      showToast(_editingNewsId ? 'Đã cập nhật bài viết!' : 'Đã đăng bài viết!');
      document.getElementById('news-editor-modal').style.display = 'none';
      renderNewsPage();
    } else {
      const data = await resp.json();
      showToast(data.error || 'Lỗi!');
    }
  } catch (e) { showToast('Lỗi kết nối server'); }
}

async function deleteNews(id) {
  if (!confirm('Xóa bài viết này?')) return;
  try {
    const token = localStorage.getItem('vs_token');
    await fetch('/api/news/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    showToast('Đã xóa bài viết');
    renderNewsPage();
  } catch (e) { showToast('Lỗi'); }
}

async function togglePinNews(id, pinned) {
  try {
    const token = localStorage.getItem('vs_token');
    await fetch('/api/news/' + id, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned })
    });
    showToast(pinned ? 'Đã ghim bài viết' : 'Đã bỏ ghim');
    renderNewsPage();
  } catch (e) { showToast('Lỗi'); }
}


// ════════════════════════════════════════
// SECTION 12: ROLE-BASED PAGE GUARD
// ════════════════════════════════════════

function isPageAllowed(pageId) {
  const role = window.VS_ROLE;
  if (role === 'admin' || role === 'staff') return true;
  if (role === 'marketing') return pageId !== 'accounts';

  // Teacher restrictions
  if (role === 'teacher') {
    const blocked = ['dashboard', 'revenue', 'payroll', 'staff', 'add-staff', 'leads', 'add-lead', 'consult', 'accounts', 'audit', 'zalo'];
    return !blocked.includes(pageId);
  }

  // Student restrictions
  if (role === 'student') {
    const allowed = ['student-portal', 'news', 'courses', 'about'];
    return allowed.includes(pageId);
  }

  return true;
}

// Teacher: hide financial data in student profile (disabled to allow viewing)
function hideFinancialDataForTeacher() {
  // Do nothing. Teachers can view tuition now.
}

// ════════════════════════════════════════
// TEACHER RATING FEATURE
// ════════════════════════════════════════

function openTeacherRatingModal(teacherName, studentId) {
  let m = document.getElementById('teacher-rating-modal');
  if (!m) { m = document.createElement('div'); m.id = 'teacher-rating-modal'; document.body.appendChild(m); }
  m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
  m.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;';

  m.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:400px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.3);text-align:center;">
      <div style="font-size:24px;margin-bottom:12px;">👩‍🏫</div>
      <div style="font-size:18px;font-weight:900;color:var(--navy);margin-bottom:8px;">Đánh giá giáo viên</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px;">Đánh giá của bạn sẽ giúp cải thiện chất lượng giảng dạy của <b>${teacherName}</b></div>
      
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:20px;" id="rating-stars">
        ${[1,2,3,4,5].map(i => `<span onclick="setRating(${i})" data-val="${i}" style="font-size:32px;color:#ccc;cursor:pointer;transition:color .2s;">★</span>`).join('')}
      </div>
      <input type="hidden" id="tr-rating" value="0">
      
      <textarea id="tr-comment" rows="4" placeholder="Để lại lời nhận xét (không bắt buộc)..." style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:10px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;margin-bottom:20px;resize:none;"></textarea>
      
      <div style="display:flex;gap:8px;">
        <button onclick="submitTeacherRating('${teacherName}', ${studentId})" class="btn btn-gold" style="flex:1;">Gửi Đánh Giá</button>
        <button onclick="document.getElementById('teacher-rating-modal').style.display='none'" style="border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;flex:1;">Hủy</button>
      </div>
    </div>
  `;
  m.style.display = 'flex';
}

function setRating(val) {
  document.getElementById('tr-rating').value = val;
  document.querySelectorAll('#rating-stars span').forEach((el, i) => {
    el.style.color = i < val ? '#f59e0b' : '#ccc';
  });
}

async function submitTeacherRating(teacherName, studentId) {
  const rating = document.getElementById('tr-rating').value;
  const comment = document.getElementById('tr-comment').value.trim();
  if (rating == 0) { showToast('Vui lòng chọn số sao!'); return; }
  
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/teacher-rating', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, teacherName, rating, comment })
    });
    if (resp.ok) {
      showToast('Đã gửi đánh giá thành công!');
      document.getElementById('teacher-rating-modal').style.display = 'none';
    } else {
      showToast('Lỗi khi gửi đánh giá');
    }
  } catch (e) { showToast('Lỗi kết nối server'); }
}


// ════════════════════════════════════════
// FINAL HOOKS OVERRIDE (v5 final)
// ════════════════════════════════════════

// Override renderReportPage to use v5 version with Chart.js
const _origRenderReportV5 = window.renderReportPage;
window.renderReportPage = function () {
  renderReportPageV5();
};

// Patch showPage with role guard + news page
const _origSPv5 = window.showPage;
window.showPage = function (id) {
  // Role-based guard
  if (!isPageAllowed(id)) {
    showToast('Bạn không có quyền truy cập trang này');
    return;
  }

  if (id === 'holidays') { renderHolidaysPage(); return; }
  if (id === 'news') {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pg = document.getElementById('page-news');
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => {
      if ((n.getAttribute('onclick') || '').includes("'news'")) n.classList.add('active');
    });
    renderNewsPage();
    return;
  }

  if (typeof _origSPv5 === 'function') _origSPv5(id);

  if (id === 'students') {
    setTimeout(addImportExcelButton, 200);
    // Teacher: hide financial columns after render
    if (window.VS_ROLE === 'teacher') {
      setTimeout(() => {
        document.querySelectorAll('.col-payment,.col-amount,.col-paydate').forEach(el => el.style.display = 'none');
      }, 300);
    }
  }
  if (id === 'report') setTimeout(renderReportPageV5, 100);
  if (id === 'dashboard' && ['admin', 'staff'].includes(window.VS_ROLE)) {
    setTimeout(initDashboardExtras, 300);
  }
};

// Fetch and display teacher ratings
async function viewTeacherRatings() {
  try {
    const token = localStorage.getItem('vs_token');
    const resp = await fetch('/api/teacher-rating', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) return;
    const ratings = await resp.json();
    
    let m = document.getElementById('teacher-rating-view-modal');
    if (!m) { m = document.createElement('div'); m.id = 'teacher-rating-view-modal'; document.body.appendChild(m); }
    m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;';

    let listHtml = ratings.map(r => `
      <div style="background:var(--bg);padding:14px;border-radius:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-weight:700;color:var(--navy);font-size:13px;">${r.studentName} <span style="color:var(--muted);font-weight:400;">đánh giá</span> ${r.teacherName}</div>
          <div style="color:#f59e0b;font-size:14px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <div style="font-size:13px;color:#444;line-height:1.5;">${r.comment || '<i>Không có nhận xét</i>'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;text-align:right;">${fmtDate(r.createdAt.split('T')[0])}</div>
      </div>
    `).join('');
    
    if (!ratings.length) listHtml = '<div style="text-align:center;color:var(--muted);padding:20px;">Chưa có đánh giá nào.</div>';

    m.innerHTML = `
      <div style="background:#fff;border-radius:20px;max-width:500px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:90vh;display:flex;flex-direction:column;">
        <div style="padding:20px;border-bottom:1px solid var(--cream2);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:18px;font-weight:800;color:var(--navy);">Đánh Giá Từ Học Viên</div>
          <button onclick="document.getElementById('teacher-rating-view-modal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
        </div>
        <div style="padding:20px;overflow-y:auto;flex:1;">
          ${listHtml}
        </div>
      </div>
    `;
    m.style.display = 'flex';
  } catch (e) {}
}

// Teacher profile override: inject rating button and set data-role on body
const _origOpenProfileV5Final = window.openStudentProfile;
window.openStudentProfile = function(studentId) {
  if (typeof _origOpenProfileV5Final === 'function') _origOpenProfileV5Final(studentId);
  document.body.setAttribute('data-role', window.VS_ROLE); // Enforce CSS hiding rules
  
  // Add rating button for student role
  if (window.VS_ROLE === 'student') {
    setTimeout(() => {
      const modal = document.getElementById('student-profile-modal');
      if (!modal) return;
      const s = students.find(x => x.id === studentId);
      const cls = s ? classes.find(c => Number(c.id) === Number(s.classid)) : null;
      if (cls && cls.teacher) {
        // Find the "Khóa Học" block and inject a button
        const infoBlocks = modal.querySelectorAll('.ptab-content div[style*="Khóa Học"]');
        infoBlocks.forEach(block => {
          if (block.innerHTML.includes('Khóa Học')) {
            const btnHtml = `<div style="margin-top:12px;text-align:center;"><button onclick="openTeacherRatingModal('${cls.teacher}', ${studentId})" style="background:#fef3c7;color:#d97706;border:1px solid #fde68a;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;width:100%;">⭐ Đánh giá Giáo viên ${cls.teacher}</button></div>`;
            if (!block.parentElement.innerHTML.includes('Đánh giá Giáo viên')) {
              block.parentElement.innerHTML += btnHtml;
            }
          }
        });
      }
    }, 200);
  }
};

// Inject News page CSS
const newsStyle = document.createElement('style');
newsStyle.textContent = `
  /* Newsletter Style News Cards */
  .news-grid { display:flex; flex-direction:column; gap:24px; max-width:800px; margin:0 auto; }
  .news-card {
    background:var(--white,#fff); border-radius:16px; padding:28px 32px;
    box-shadow:0 8px 30px rgba(0,0,0,.04); border:1px solid var(--cream2,#eef2f5);
    transition:transform .2s,box-shadow .2s; border-left:4px solid transparent;
  }
  .news-card:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,.08); }
  .news-card.pinned { border-left-color:var(--gold); background:linear-gradient(to right,#fffcf3,#fff); }
  .news-pin { font-size:11px; font-weight:800; color:var(--gold); margin-bottom:12px; text-transform:uppercase; letter-spacing:1px; display:inline-block; background:#fff8e1; padding:4px 10px; border-radius:20px; }
  .news-card-header { display:flex; gap:12px; align-items:center; margin-bottom:16px; }
  .news-cat { font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; }
  .news-date { font-size:12px; color:var(--muted); font-weight:600; }
  .news-title { font-size:24px; font-weight:900; color:var(--navy); margin:0 0 16px; line-height:1.3; }
  .news-imgs { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:20px; border-radius:12px; overflow:hidden; }
  .news-body { font-size:15px; color:#444; line-height:1.8; margin-bottom:20px; position:relative; }
  .news-footer { display:flex; justify-content:space-between; align-items:center; padding-top:16px; border-top:1px solid var(--cream2,#eef2f5); margin-top:10px; }
  .news-author { font-size:13px; color:var(--muted); font-weight:700; display:flex; align-items:center; gap:6px; }
  .news-author::before { content:''; display:inline-block; width:24px; height:24px; border-radius:50%; background:var(--gold); opacity:0.8; }
  .news-actions { display:flex; gap:8px; }
  .news-btn-edit,.news-btn-pin,.news-btn-del {
    background:#f8fafc; border:1px solid var(--cream2,#eef2f5); border-radius:8px;
    padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; font-family:'Be Vietnam Pro',sans-serif;
    color:var(--muted); transition:all .2s;
  }
  .news-btn-edit:hover { background:var(--cream); color:var(--navy); border-color:#cbd5e1; }
  .news-btn-del:hover { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
  .news-btn-pin:hover { background:#fef9c3; color:#92400e; border-color:#fde68a; }

  /* RBAC Edit Hiding via CSS */
  body[data-role="teacher"] button[onclick^="editStudent"],
  body[data-role="student"] button[onclick^="editStudent"],
  body[data-role="teacher"] .btn-edit,
  body[data-role="student"] .btn-edit {
    display: none !important;
  }


  /* Notification dropdown */
  #noti-dropdown {
    position:fixed; top:60px; right:20px; width:380px; max-height:480px;
    background:var(--white,#fff); border-radius:16px; box-shadow:0 12px 48px rgba(0,0,0,.18);
    border:1px solid var(--cream2,#eef2f5); z-index:10000; overflow:hidden;
    font-family:'Be Vietnam Pro',sans-serif;
  }
  .noti-header { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid var(--cream2,#eef2f5); font-size:13px; font-weight:700; color:var(--navy); }
  .noti-list { max-height:400px; overflow-y:auto; }
  .noti-item { padding:12px 18px; border-bottom:1px solid var(--cream2,#eef2f5); transition:background .12s; cursor:default; }
  .noti-item:hover { background:var(--cream,#f9fafb); }
  .noti-item.unread { background:#eff6ff; }
  .noti-msg { font-size:12px; color:var(--ink,#333); line-height:1.5; }
  .noti-time { font-size:10px; color:var(--muted); margin-top:3px; }

  /* Holiday calendar */
  .holiday-cal { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .hc-header { text-align:center; font-size:10px; font-weight:700; color:var(--muted); padding:6px 0; }
  .hc-day { text-align:center; padding:8px 4px; border-radius:8px; font-size:12px; font-weight:600; color:var(--ink,#333); background:var(--cream,#f9fafb); cursor:default; transition:all .12s; }
  .hc-day.today { background:linear-gradient(135deg,var(--gold),#e08515); color:#fff; font-weight:800; }
  .hc-day.holiday { background:linear-gradient(135deg,#fee2e2,#fecaca); color:#dc2626; border:1px solid #fca5a5; }
  .hc-day.sunday { color:#ef4444; }

  /* Dark mode news */
  body.dark-mode .news-card { background:var(--white); border-color:var(--cream2); }
  body.dark-mode .news-body::after { background:linear-gradient(transparent,var(--white)); }
  body.dark-mode #noti-dropdown { background:var(--white); border-color:var(--cream2); }
  body.dark-mode .noti-item.unread { background:rgba(59,130,246,.08); }

  /* Responsive news */
  @media(max-width:768px) {
    .news-grid { grid-template-columns:1fr; }
    #noti-dropdown { right:10px; left:10px; width:auto; }
    .holiday-layout { grid-template-columns:1fr!important; }
  }
`;
document.head.appendChild(newsStyle);

console.log('✅ app_v5.js loaded – Vinsoul Academy v5.0 + News + RBAC');
