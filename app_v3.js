// ═══════════════════════════════════════════════════
//  app_v3.js – Vinsoul Academy v3.0
//  Load AFTER app.js
// ═══════════════════════════════════════════════════

// ════════════════════════════════════════
// THEMES
// ════════════════════════════════════════
const THEMES = {
  default:  {label:'Mặc Định',      navy:'#234A5B', gold:'#F69922', bg:'#f4f1eb', accent:'#2d5f75'},
  midnight: {label:'Đêm Xanh',      navy:'#0f172a', gold:'#38bdf8', bg:'#f0f9ff', accent:'#1e3a5f'},
  forest:   {label:'Rừng Xanh',     navy:'#14532d', gold:'#4ade80', bg:'#f0fdf4', accent:'#166534'},
  rose:     {label:'Hồng Đào',      navy:'#881337', gold:'#fb7185', bg:'#fff1f2', accent:'#9f1239'},
  violet:   {label:'Tím Hoàng Gia', navy:'#3b0764', gold:'#c084fc', bg:'#faf5ff', accent:'#6b21a8'},
  amber:    {label:'Hổ Phách',      navy:'#78350f', gold:'#f59e0b', bg:'#fffbeb', accent:'#92400e'},
};

function applyTheme(key) {
  const t = THEMES[key] || THEMES.default;
  const r = document.documentElement;
  r.style.setProperty('--navy', t.navy);
  r.style.setProperty('--gold', t.gold);
  r.style.setProperty('--cream', t.bg);
  r.style.setProperty('--accent', t.accent);
  // Sidebar gradient
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) sidebar.style.background = `linear-gradient(175deg, ${t.navy} 0%, ${t.accent} 100%)`;
  localStorage.setItem('vs_theme', key);
}

function showThemePicker() {
  let m = document.getElementById('theme-modal');
  if (!m) { m = document.createElement('div'); m.id = 'theme-modal'; m.onclick = e => { if (e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `<div style="background:#fff;border-radius:20px;padding:26px 22px;max-width:400px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-weight:800;font-size:16px;color:#234A5B;margin-bottom:16px;">Chọn Giao Diện</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      ${Object.entries(THEMES).map(([k,t])=>`
        <div onclick="applyTheme('${k}');document.getElementById('theme-modal').style.display='none'"
          style="border:2px solid #eee;border-radius:12px;padding:11px 13px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:.15s;"
          onmouseover="this.style.borderColor='${t.gold}'" onmouseout="this.style.borderColor='#eee'">
          <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${t.navy},${t.gold});flex-shrink:0;"></div>
          <span style="font-size:12px;font-weight:700;color:#333;">${t.label}</span>
        </div>`).join('')}
    </div>
    <button onclick="document.getElementById('theme-modal').style.display='none'"
      style="width:100%;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Đóng</button>
  </div>`;
  m.style.display = 'flex';
}

// ════════════════════════════════════════
// RBAC – Ẩn/hiện sidebar theo role
// ════════════════════════════════════════
function applyRBAC(role) {
  window.VS_ROLE = role;
  document.body.setAttribute('data-role', role);
  const hide = sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
  const show = sel => document.querySelectorAll(sel).forEach(el => el.style.display = '');

  // Reset
  document.querySelectorAll('.nav-section').forEach(el => el.style.display = '');
  document.querySelectorAll('.vs-hide-student,.vs-hide-teacher,.vs-admin-only,.vs-admin-staff-only,.vs-student-only').forEach(el => el.style.display = '');
  // Show edit buttons again before re-applying logic
  document.querySelectorAll('.btn-edit-student').forEach(el => el.style.display = '');

  if (role === 'student') {
    hide('.vs-hide-student');
    hide('.vs-admin-only');
    hide('.vs-admin-staff-only');
    show('.vs-student-only');
    hide('.btn-edit-student'); // Hide edit button
    
    // Hide Dashboard and Backup/Restore
    hide('.nav-item[onclick*="dashboard"]');
    hide('button[onclick*="exportBackup"]');
    hide('button[onclick*="importBackup"]');
    
    // Student: redirect to news page instead of dashboard
    setTimeout(() => showPage('news'), 100);
  } else if (role === 'teacher') {
    hide('.vs-hide-teacher');
    hide('.vs-admin-only');
    hide('.vs-admin-staff-only');
    hide('.vs-student-only');
    hide('.btn-edit-student'); // Hide edit button
    // Teacher: redirect to news page instead of dashboard
    setTimeout(() => showPage('news'), 100);
  } else if (role === 'staff') {
    hide('.vs-admin-only');
    hide('.vs-student-only');
    // Staff no longer sees accounts/audit
    hide('#nav-section-accounts');
  } else if (role === 'admin') {
    hide('.vs-student-only');
    show('#nav-section-accounts');
  }
}

// ════════════════════════════════════════
// HAMBURGER MENU (mobile)
// ════════════════════════════════════════
function initHamburger() {
  if (document.getElementById('vs-hamburger')) return;
  const btn = document.createElement('button');
  btn.id = 'vs-hamburger';
  btn.innerHTML = '☰';
  btn.style.cssText = 'display:none;position:fixed;top:13px;left:13px;z-index:200;background:var(--navy);color:#fff;border:none;border-radius:8px;width:38px;height:38px;font-size:18px;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);';
  btn.onclick = toggleSidebar;
  document.body.appendChild(btn);

  const ov = document.createElement('div');
  ov.id = 'vs-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99;display:none;';
  ov.onclick = toggleSidebar;
  document.body.appendChild(ov);

  const mq = window.matchMedia('(max-width:768px)');
  const handle = e => { btn.style.display = e.matches ? 'flex' : 'none'; };
  mq.addEventListener('change', handle); handle(mq);
}

function toggleSidebar() {
  const sb = document.getElementById('main-sidebar');
  const ov = document.getElementById('vs-overlay');
  if (!sb) return;
  sb.classList.toggle('sb-open');
  if (ov) ov.style.display = sb.classList.contains('sb-open') ? 'block' : 'none';
}

// ════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════
let _notifTimer = null;

async function loadNotifications() {
  try {
    const r = await fetch('/api/notifications');
    if (!r.ok) return;
    const list = await r.json();
    const unread = list.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = unread || ''; badge.style.display = unread > 0 ? 'flex' : 'none'; }
  } catch {}
}

async function showNotifications() {
  let m = document.getElementById('notif-modal');
  if (!m) { m = document.createElement('div'); m.id = 'notif-modal'; m.onclick = e => { if (e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:flex-end;padding:60px 12px 12px;';

  const r = await fetch('/api/notifications').catch(()=>null);
  const list = r&&r.ok ? await r.json() : [];
  await fetch('/api/notifications/read',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';

  const items = list.length
    ? list.slice(0,20).map(n=>`<div style="padding:11px 0;border-bottom:1px solid #f0f0f0;font-size:12.5px;"><div style="font-weight:700;color:var(--navy);margin-bottom:2px;">${n.studentName||''}</div><div style="color:#555;">${n.message}</div><div style="font-size:10px;color:#aaa;margin-top:2px;">${n.createdDate||''}</div></div>`).join('')
    : '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">Không có thông báo mới</div>';

  m.innerHTML = `<div style="background:#fff;border-radius:16px;width:310px;max-height:480px;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.2);font-family:'Be Vietnam Pro',sans-serif;">
    <div style="padding:14px 16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#fff;">
      <div style="font-weight:800;color:var(--navy);font-size:14px;">Thông Báo</div>
      <button onclick="document.getElementById('notif-modal').style.display='none'" style="background:none;border:none;font-size:17px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="padding:0 16px 12px;">${items}</div>
  </div>`;
  m.style.display = 'flex';
}

async function checkReminders() {
  try {
    await fetch('/api/check-reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    await loadNotifications();
  } catch {}
}

// ════════════════════════════════════════
// STAFF ATTENDANCE PAGE
// ════════════════════════════════════════
let staffAttData = [];

async function renderStaffAttendancePage() {
  const role = window.VS_ROLE;
  const content = document.getElementById('staff-att-content');
  if (!content) return;

  const now = new Date();
  const monthStr = now.toISOString().slice(0,7);

  // Load data
  const r = await fetch(`/api/staff-attendance?month=${monthStr}`).catch(()=>null);
  staffAttData = r&&r.ok ? await r.json() : [];

  const myStaffId = window.VS_USER?.linkedStaffId || null;

  // Build staff list for dropdown (teacher sees only themselves)
  let staffOptions = '';
  if (role === 'teacher' && myStaffId) {
    const me = staff.find(s => String(s.id) === String(myStaffId));
    staffOptions = `<option value="${myStaffId}">${me ? me.name : 'Tôi'}</option>`;
  } else {
    staffOptions = staff.map(s => `<option value="${s.id}">${s.name} – ${s.role}</option>`).join('');
  }

  // Summary table
  const summary = buildStaffAttSummary(staffAttData, monthStr);

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <input type="month" id="sa-month" value="${monthStr}" onchange="reloadStaffAtt()"
          style="border:1.5px solid var(--cream2);border-radius:8px;padding:7px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;background:#fff;">
        ${role!=='teacher'?`<select id="sa-staff-filter" onchange="reloadStaffAtt()" style="border:1.5px solid var(--cream2);border-radius:8px;padding:7px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;background:#fff;"><option value="">Tất cả nhân viên</option>${staffOptions}</select>`:''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="openCheckInModal()" class="btn btn-gold">+ Chấm Công Hôm Nay</button>
        <a href="/api/export/staff-attendance" style="text-decoration:none;"><button class="btn" style="background:var(--navy);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📥 Xuất Excel</button></a>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:18px;">
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${summary.total}</div><div class="stat-label">Tổng Lượt CC</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#22c55e">${summary.onTime}</div><div class="stat-label">Đúng Giờ</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#ef4444">${summary.late}</div><div class="stat-label">Đi Muộn</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--navy)">${summary.staffCount}</div><div class="stat-label">Nhân Viên</div></div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button onclick="switchSATab('overview')" id="sa-tab-overview" class="btn btn-gold" style="font-size:12px;padding:7px 14px;">Tổng Quan</button>
      <button onclick="switchSATab('detail')" id="sa-tab-detail" class="btn" style="font-size:12px;padding:7px 14px;background:var(--cream2);color:var(--navy);border:none;border-radius:8px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Chi Tiết</button>
    </div>
    <div id="sa-tab-content"></div>
  `;

  switchSATab('overview');
}

function buildStaffAttSummary(data, month) {
  const filtered = data.filter(a => a.date && a.date.startsWith(month));
  const staffIds = [...new Set(filtered.map(a=>a.staffId))];
  let late = 0;
  filtered.forEach(a => {
    if (a.checkIn) {
      const h = parseInt(a.checkIn.split(':')[0]);
      const m2 = parseInt(a.checkIn.split(':')[1]||'0');
      if (h > 8 || (h===8 && m2 > 15)) late++;
    }
  });
  return { total: filtered.length, onTime: filtered.length - late, late, staffCount: staffIds.length };
}

function switchSATab(tab) {
  ['overview','detail'].forEach(t => {
    const btn = document.getElementById(`sa-tab-${t}`);
    if (!btn) return;
    if (t === tab) { btn.style.background = 'var(--gold)'; btn.style.color = '#fff'; }
    else { btn.style.background = 'var(--cream2)'; btn.style.color = 'var(--navy)'; }
  });

  const month = (document.getElementById('sa-month')||{value:new Date().toISOString().slice(0,7)}).value;
  const filtered = staffAttData.filter(a => a.date && a.date.startsWith(month));
  const tc = document.getElementById('sa-tab-content');
  if (!tc) return;

  if (tab === 'overview') {
    // Group by staff
    const byStaff = {};
    filtered.forEach(a => {
      if (!byStaff[a.staffId]) byStaff[a.staffId] = [];
      byStaff[a.staffId].push(a);
    });
    const rows = Object.entries(byStaff).map(([sid, recs]) => {
      const s = staff.find(x => String(x.id)===String(sid));
      let late=0;
      recs.forEach(r => {
        if (r.checkIn) { const [h,m2]= r.checkIn.split(':').map(Number); if(h>8||(h===8&&m2>15)) late++; }
      });
      const totalMin = recs.reduce((acc,r)=>{
        if(!r.checkIn||!r.checkOut) return acc;
        const toMin = t => { const [h,m2]=t.split(':').map(Number); return h*60+m2; };
        return acc + Math.max(0, toMin(r.checkOut)-toMin(r.checkIn));
      }, 0);
      return `<tr>
        <td><div style="font-weight:700;color:var(--navy)">${s?s.name:sid}</div><div style="font-size:11px;color:var(--muted)">${s?s.role:''}</div></td>
        <td style="text-align:center">${recs.length}</td>
        <td style="text-align:center;color:#22c55e;font-weight:700">${recs.length-late}</td>
        <td style="text-align:center;color:#ef4444;font-weight:700">${late}</td>
        <td style="text-align:center">${Math.floor(totalMin/60)}h${totalMin%60?totalMin%60+'m':''}</td>
      </tr>`;
    }).join('');
    tc.innerHTML = `<div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Nhân Viên</th><th>Ngày Làm</th><th>Đúng Giờ</th><th>Đi Muộn</th><th>Tổng Giờ</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu tháng này</td></tr>'}</tbody>
    </table></div></div>`;
  } else {
    // Calendar detail view
    const sorted = [...filtered].sort((a,b)=>a.date>b.date?-1:1);
    const rows = sorted.map(a => {
      const s = staff.find(x => String(x.id)===String(a.staffId));
      let lateMin = 0;
      if (a.checkIn) { const [h,m2]=a.checkIn.split(':').map(Number); const diff=(h*60+m2)-8*60; if(diff>15) lateMin=diff-15; }
      const inImg = a.checkInImage ? `<img src="${a.checkInImage}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;cursor:pointer;border:1px solid #e0e0e0;margin-right:8px" onclick="window.open('${a.checkInImage}')" title="Xem ảnh Check-in" />` : '';
      const outImg = a.checkOutImage ? `<img src="${a.checkOutImage}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;cursor:pointer;border:1px solid #e0e0e0;margin-right:8px" onclick="window.open('${a.checkOutImage}')" title="Xem ảnh Check-out" />` : '';
      return `<tr>
        <td style="vertical-align:middle;">${fmtDate(a.date)}</td>
        <td style="vertical-align:middle;"><div style="font-weight:600">${s?s.name:a.staffId}</div></td>
        <td style="vertical-align:middle;font-weight:700;color:${lateMin>0?'#ef4444':'#22c55e'}">
          <div style="display:flex;align-items:center;">
             ${inImg}
             <div>${a.checkIn||'–'} ${lateMin>0?`<br><span style="font-size:10px">(muộn ${lateMin}p)</span>`:''}</div>
          </div>
        </td>
        <td style="vertical-align:middle;">
          <div style="display:flex;align-items:center;">
             ${outImg}
             <div style="font-weight:700;">${a.checkOut||'–'}</div>
          </div>
        </td>
        <td style="vertical-align:middle;"><span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--cream2);color:var(--navy)">${a.method==='faceid'?'FaceID':(a.method==='camera'?'Camera':'Thủ công')}</span></td>
        <td style="font-size:11px;color:var(--muted);vertical-align:middle;">${a.note||'–'}</td>
      </tr>`;
    }).join('');
    tc.innerHTML = `<div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Ngày</th><th>Nhân Viên</th><th>Giờ Vào</th><th>Giờ Ra</th><th>Phương Thức</th><th>Ghi Chú</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu</td></tr>'}</tbody>
    </table></div></div>`;
  }
}

async function reloadStaffAtt() {
  const month = (document.getElementById('sa-month')||{value:''}).value;
  const r = await fetch(`/api/staff-attendance?month=${month}`).catch(()=>null);
  staffAttData = r&&r.ok ? await r.json() : [];
  switchSATab('overview');
}

function openCheckInModal() {
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId || null;

  let m = document.getElementById('checkin-modal');
  if (!m) { m = document.createElement('div'); m.id = 'checkin-modal'; m.onclick = e => { if(e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const now = new Date();
  const timeNow = now.toTimeString().slice(0,5);
  const dateNow = now.toISOString().slice(0,10);

  let staffSel = '';
  if (role === 'teacher' && myStaffId) {
    const me = staff.find(s=>String(s.id)===String(myStaffId));
    staffSel = `<input type="hidden" id="ci-staff" value="${myStaffId}"><div style="font-size:13px;font-weight:700;color:var(--navy);padding:10px 0;">${me?me.name:'Tôi'}</div>`;
  } else {
    staffSel = `<select id="ci-staff" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:12px;">
      ${staff.map(s=>`<option value="${s.id}">${s.name} – ${s.role}</option>`).join('')}
    </select>`;
  }

  m.innerHTML = `<div style="background:#fff;border-radius:20px;padding:26px 22px;max-width:420px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <div style="font-weight:800;font-size:16px;color:var(--navy);">Chấm Công Hôm Nay</div>
      <button onclick="document.getElementById('checkin-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:6px;">Nhân Viên</label>
    ${staffSel}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ngày</label>
        <input type="date" id="ci-date" value="${dateNow}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Giờ Vào</label>
        <input type="time" id="ci-in" value="${timeNow}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Giờ Ra (tùy chọn)</label>
        <input type="time" id="ci-out" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Phương Thức</label>
        <select id="ci-method" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
          <option value="manual">Thủ Công</option>
          <option value="faceid">FaceID</option>
        </select>
      </div>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ghi Chú</label>
    <input type="text" id="ci-note" placeholder="Ghi chú nếu có..." style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:16px;box-sizing:border-box;">
    <button onclick="submitCheckIn()" class="btn btn-gold" style="width:100%;">Lưu Chấm Công</button>
  </div>`;
  m.style.display = 'flex';
}

async function submitCheckIn() {
  const staffId = document.getElementById('ci-staff')?.value;
  const date    = document.getElementById('ci-date')?.value;
  const checkIn = document.getElementById('ci-in')?.value;
  const checkOut= document.getElementById('ci-out')?.value;
  const method  = document.getElementById('ci-method')?.value;
  const note    = document.getElementById('ci-note')?.value;
  if (!staffId || !date || !checkIn) { showToast('Vui lòng chọn nhân viên, ngày và giờ vào', true); return; }
  try {
    const r = await fetch('/api/staff-attendance', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({staffId, date, checkIn, checkOut, method, note})
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error||'Lỗi lưu', true); return; }
    showToast('Đã lưu chấm công!');
    document.getElementById('checkin-modal').style.display = 'none';
    renderStaffAttendancePage();
  } catch(e) { showToast('Lỗi kết nối', true); }
}

// ════════════════════════════════════════
// VIETQR MODAL
// ════════════════════════════════════════
async function showVietQR(studentId) {
  const s = students.find(x=>x.id===studentId);
  if (!s || !s.amount) { showToast('Học viên chưa có học phí!', true); return; }
  const subCode = (s.subject||'HP').replace(/\s+/g,'').toUpperCase().slice(0,8);
  const studentCode = `U${s.id}_${subCode}`;
  const r = await fetch('/api/vietqr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:s.amount,studentCode})});
  const data = await r.json();
  let m = document.getElementById('qr-modal');
  if (!m) { m=document.createElement('div');m.id='qr-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:360px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div style="font-weight:800;font-size:16px;color:var(--navy)">Thanh Toán Học Phí</div>
      <button onclick="document.getElementById('qr-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="text-align:center;margin-bottom:14px;"><img src="${data.qrUrl}" style="width:210px;height:210px;border-radius:12px;border:2px solid #eee;"></div>
    <div style="background:#f8fafc;border-radius:12px;padding:12px 14px;font-size:12.5px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Học viên:</span><span style="font-weight:700;color:var(--navy)">${s.name}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Số tiền:</span><span style="font-weight:800;color:var(--gold);font-size:15px">${fmt(s.amount)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Ngân hàng:</span><span style="font-weight:600">Vietcombank</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Số TK:</span><span style="font-weight:700;font-family:monospace">1731238888</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#666">Nội dung:</span><span style="font-weight:700;color:var(--navy);font-size:11px">VS_${studentCode}_HOCPHI</span></div>
    </div>
    <div style="font-size:10px;color:#aaa;text-align:center;margin-top:10px">Quét bằng app ngân hàng hoặc Zalo Pay</div>
  </div>`;
  m.style.display='flex';
}

// ════════════════════════════════════════
// STUDENT PORTAL
// ════════════════════════════════════════
function renderStudentPortal() {
  const content = document.getElementById('student-portal-content');
  if (!content) return;
  const myData = students[0];
  if (!myData) { content.innerHTML = '<div class="card" style="padding:30px;text-align:center;color:var(--muted)">Không tìm thấy thông tin học viên</div>'; return; }

  // Count sessions
  let doneSessions = 0;
  (attendance||[]).forEach(a => { if (a.records&&a.records[String(myData.id)]==='present') doneSessions++; });
  (makeups||[]).forEach(m2 => { if (String(m2.studentId)===String(myData.id)&&m2.status==='done') doneSessions++; });
  const totalPkg = (() => { const m2=(myData.pkg||'').match(/(\d+)\s*buổi/); return m2?parseInt(m2[1]):0; })();
  const pct = totalPkg ? Math.min(100,Math.round(doneSessions/totalPkg*100)) : 0;
  const daysLeft = myData.end ? Math.ceil((new Date(myData.end)-new Date())/(1000*60*60*24)) : null;
  const feedbacks = (myData.feedbacks||[]).slice().reverse();

  content.innerHTML = `
    <div class="page-header"><div class="page-title">Thông Tin <span>Của Tôi</span></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:16px;">
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Hồ Sơ Học Viên</div>
        <div style="font-size:13px;line-height:2.2">
          <div><b>Họ tên:</b> ${myData.name}</div>
          <div><b>Ngày sinh:</b> ${fmtDate(myData.dob)}</div>
          <div><b>Phụ huynh:</b> ${myData.parent||'–'}</div>
          <div><b>Môn học:</b> ${myData.subject||'–'}</div>
          <div><b>Gói học:</b> ${myData.pkg||'–'}</div>
          <div><b>Ngày bắt đầu:</b> ${fmtDate(myData.start)}</div>
          <div><b>Ngày kết thúc:</b> ${fmtDate(myData.end)}${daysLeft!==null&&daysLeft<=14?`<span style="color:#dc2626;font-weight:700;margin-left:6px">⏰ còn ${daysLeft} ngày</span>`:''}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Tiến Độ Học</div>
        <div style="text-align:center;padding:8px 0">
          <div style="font-size:38px;font-weight:800;color:var(--gold)">${doneSessions}<span style="font-size:18px;color:var(--muted)">/${totalPkg||'?'}</span></div>
          <div style="font-size:12px;color:var(--muted);margin:4px 0 12px">buổi đã học</div>
          <div style="background:var(--cream2);border-radius:8px;height:10px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:var(--gold);border-radius:8px;transition:.4s"></div>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:6px">${pct}% hoàn thành</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:12px">Nhận Xét Từ Giáo Viên</div>
      ${feedbacks.length ? feedbacks.slice(0,10).map(f=>`
        <div style="border-left:3px solid var(--gold);padding:10px 14px;margin-bottom:10px;background:var(--cream);border-radius:0 8px 8px 0">
          <div style="font-size:11px;color:var(--muted);margin-bottom:3px">${f.by} · ${new Date(f.at).toLocaleDateString('vi-VN')}</div>
          ${f.feedback?`<div style="font-size:13px;color:var(--navy)">${f.feedback}</div>`:''}
          ${f.homework?`<div style="font-size:12px;color:#555;margin-top:3px"><b>Bài về nhà:</b> ${f.homework}</div>`:''}
          ${(f.mediaUrls||[]).map(u=>`<a href="${u}" target="_blank" style="font-size:11px;color:var(--gold)">Xem tệp đính kèm</a>`).join(' ')}
        </div>`).join('') : '<div style="color:var(--muted);font-size:13px">Chưa có nhận xét nào</div>'}
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:12px">Ảnh & Video Của Tôi</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;">
        ${(myData.mediaFiles||[]).length ? myData.mediaFiles.map(m=>`
          <div style="position:relative;height:120px;border-radius:10px;overflow:hidden;border:1px solid var(--cream2);box-shadow:0 4px 12px rgba(0,0,0,0.05);transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            <a href="${m.url}" target="_blank" style="display:block;height:100%;">
              ${m.url.match(/\.(mp4|webm|ogg)$/i) ? 
                `<video src="${m.url}" style="width:100%;height:100%;object-fit:cover;" muted></video>` : 
                `<img src="${m.url}" style="width:100%;height:100%;object-fit:cover;">`
              }
            </a>
            <a href="${m.url}" download="media_${Date.now()}" style="position:absolute;bottom:6px;right:6px;background:rgba(255,255,255,0.9);color:var(--navy);border-radius:6px;padding:4px 8px;font-size:10px;font-weight:700;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,0.15);backdrop-filter:blur(4px);">📥 Tải chất lượng cao</a>
          </div>
        `).join('') : '<div style="color:var(--muted);font-size:13px;grid-column:1/-1;">Chưa có hình ảnh/video nào</div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Chia Sẻ Của Tôi</div>
      <textarea id="student-share" style="width:100%;min-height:90px;border:1.5px solid var(--cream2);border-radius:10px;padding:11px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;resize:vertical;box-sizing:border-box;" placeholder="Chia sẻ cảm nhận, câu hỏi...">${myData.studentShare||''}</textarea>
      <button onclick="saveStudentShare(${myData.id})" class="btn btn-gold" style="margin-top:10px">Lưu</button>
    </div>
  `;
}

async function saveStudentShare(sid) {
  const val = document.getElementById('student-share')?.value||'';
  const r = await fetch(`/api/student/${sid}/share`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({share:val})});
  if (r.ok) showToast('Đã lưu chia sẻ!');
  else showToast('Lỗi lưu!', true);
}

// ════════════════════════════════════════
// TEACHER FEEDBACK MODAL
// ════════════════════════════════════════
function openFeedbackModal(studentId) {
  const s = students.find(x=>x.id===studentId); if(!s) return;
  let m = document.getElementById('feedback-modal');
  if (!m) { m=document.createElement('div');m.id='feedback-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:480px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-weight:800;font-size:15px;color:var(--navy)">Nhận Xét: ${s.name}</div>
      <button onclick="document.getElementById('feedback-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px">Nhận Xét</label>
    <textarea id="fb-txt" style="width:100%;min-height:75px;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;" placeholder="Nhận xét quá trình học..."></textarea>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px">Bài Về Nhà</label>
    <textarea id="fb-hw" style="width:100%;min-height:55px;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;" placeholder="Bài tập về nhà..."></textarea>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px">Link Video/Ảnh (mỗi dòng 1 link)</label>
    <textarea id="fb-media" style="width:100%;min-height:45px;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;" placeholder="https://drive.google.com/..."></textarea>
    <div style="display:flex;gap:8px;">
      <button onclick="submitFeedback(${studentId})" class="btn btn-gold" style="flex:1">Lưu Nhận Xét</button>
      <button onclick="document.getElementById('feedback-modal').style.display='none'" style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>
  </div>`;
  m.style.display='flex';
}

async function submitFeedback(studentId) {
  const feedback  = document.getElementById('fb-txt')?.value||'';
  const homework  = document.getElementById('fb-hw')?.value||'';
  const mediaUrls = (document.getElementById('fb-media')?.value||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const r = await fetch(`/api/student/${studentId}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feedback,homework,mediaUrls})});
  if (r.ok) { showToast('Đã lưu nhận xét!'); document.getElementById('feedback-modal').style.display='none'; }
  else { const d=await r.json(); showToast(d.error||'Lỗi lưu', true); }
}

// ════════════════════════════════════════
// AUDIT PAGE
// ════════════════════════════════════════
async function renderAuditPage() {
  showPage('audit');
  const c = document.getElementById('audit-content'); if(!c) return;
  c.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Đang tải...</div>';
  const r = await fetch('/api/audit?limit=200').catch(()=>null);
  if (!r||!r.ok) { c.innerHTML='<div style="padding:20px;color:red">Lỗi tải nhật ký</div>'; return; }
  const logs = await r.json();
  c.innerHTML=`<div class="card"><div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Người Dùng</th><th>Hành Động</th><th>Chi Tiết</th><th>Thời Gian</th></tr></thead>
    <tbody>${logs.map((l,i)=>`<tr><td style="color:var(--muted);font-size:11px">${i+1}</td><td style="font-weight:700;color:var(--navy)">${l.user}</td><td><span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--cream2);font-weight:700">${l.action}</span></td><td style="font-size:12px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.detail}</td><td style="font-size:11px;color:var(--muted)">${new Date(l.time).toLocaleString('vi-VN')}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Chưa có nhật ký</td></tr>'}</tbody>
  </table></div></div>`;
}

// ════════════════════════════════════════
// ZALO CONFIG PAGE
// ════════════════════════════════════════
async function renderZaloConfig() {
  showPage('zalo');
  const c = document.getElementById('zalo-content'); if(!c) return;
  const r = await fetch('/api/zalo/config').catch(()=>null);
  const cfg = r&&r.ok ? await r.json() : {};
  const statusBadge = cfg.oaAccessToken
    ? `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">✓ Đã kết nối</span>`
    : `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">✗ Chưa kết nối</span>`;

  c.innerHTML=`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px;">

    <!-- CỘT TRÁI: Cài đặt -->
    <div>
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div class="card-title">Kết Nối Zalo ZNS</div>
          ${statusBadge}
        </div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">OA Access Token</label>
        <input id="zalo-token" type="password"
          style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;"
          placeholder="Dán token từ Zalo Business tại đây" value="${cfg.oaAccessToken||''}">
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Template ID (ZNS nhắc học phí)</label>
        <input id="zalo-tpl"
          style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;"
          placeholder="VD: 123456" value="${cfg.templateId||''}">
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Template ID (ZNS nhắc học bù)</label>
        <input id="zalo-tpl-makeup"
          style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;"
          placeholder="VD: 789012" value="${cfg.templateIdMakeup||''}">
        <button onclick="saveZaloConfig()" class="btn btn-gold" style="width:100%;">💾 Lưu Cấu Hình</button>
        ${cfg.updatedAt?`<div style="font-size:11px;color:var(--muted);margin-top:8px;text-align:center;">Cập nhật: ${new Date(cfg.updatedAt).toLocaleString('vi-VN')}</div>`:''}
      </div>

      <!-- Test gửi tin nhắn thử -->
      <div class="card">
        <div class="card-title" style="margin-bottom:12px;">Gửi Tin Thử Nghiệm</div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Số điện thoại (084xxxxxxx)</label>
        <input id="zalo-test-phone"
          style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;"
          placeholder="Nhập SĐT để test">
        <button onclick="sendZaloTest()" class="btn" style="width:100%;background:var(--navy);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
          📤 Gửi Tin Thử
        </button>
        <div id="zalo-test-result" style="margin-top:10px;font-size:12px;"></div>
      </div>
    </div>

    <!-- CỘT PHẢI: Hướng dẫn -->
    <div class="card" style="height:fit-content;">
      <div class="card-title" style="margin-bottom:14px;">📋 Hướng Dẫn Tích Hợp</div>

      <div style="background:var(--cream);border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:8px;">Bước 1 — Tạo Zalo OA</div>
        <div style="font-size:12px;color:#555;line-height:1.7;">
          1. Vào <a href="https://oa.zalo.me" target="_blank" style="color:var(--gold);font-weight:700;">oa.zalo.me</a> → Đăng ký Official Account<br>
          2. Chọn loại tài khoản: <b>Doanh nghiệp</b><br>
          3. Điền thông tin Vinsoul Academy<br>
          4. Chờ duyệt (1-3 ngày làm việc)
        </div>
      </div>

      <div style="background:var(--cream);border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:8px;">Bước 2 — Lấy Access Token</div>
        <div style="font-size:12px;color:#555;line-height:1.7;">
          1. Vào <a href="https://developers.zalo.me" target="_blank" style="color:var(--gold);font-weight:700;">developers.zalo.me</a><br>
          2. Tạo ứng dụng mới → chọn OA vừa tạo<br>
          3. Vào <b>Settings → OA Access Token</b><br>
          4. Bấm <b>Generate</b> → Copy token → Dán vào ô bên trái
        </div>
      </div>

      <div style="background:var(--cream);border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:8px;">Bước 3 — Tạo Template ZNS</div>
        <div style="font-size:12px;color:#555;line-height:1.7;">
          1. Vào <a href="https://business.zalo.me" target="_blank" style="color:var(--gold);font-weight:700;">business.zalo.me</a> → ZNS<br>
          2. Tạo template <b>"Nhắc học phí"</b> với nội dung:<br>
          <div style="background:#fff;border-radius:6px;padding:8px 10px;margin-top:6px;font-family:monospace;font-size:11px;color:#333;border:1px solid #eee;">
            Xin chào {{student_name}}, khóa {{subject}} của bé còn {{days_left}} ngày là kết thúc ({{end_date}}). Vui lòng liên hệ Vinsoul để gia hạn.
          </div>
          3. Template phải có các biến: <b>student_name, subject, days_left, end_date</b><br>
          4. Sau khi duyệt → Copy <b>Template ID</b> → Dán vào ô bên trái
        </div>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;">
        <div style="font-weight:700;font-size:12px;color:#92400e;margin-bottom:4px;">⚠️ Lưu ý quan trọng</div>
        <div style="font-size:11px;color:#92400e;line-height:1.7;">
          • ZNS chỉ gửi được đến SĐT đã <b>đăng ký Zalo</b><br>
          • Mỗi tin ZNS có phí (~50-200 VNĐ/tin)<br>
          • Template phải được Zalo <b>phê duyệt</b> trước<br>
          • Token hết hạn sau <b>90 ngày</b>, cần refresh
        </div>
      </div>
    </div>
  </div>

  <!-- Lịch sử gửi ZNS -->
  <div class="card" style="max-width:900px;margin-top:14px;">
    <div class="card-title" style="margin-bottom:12px;">Lịch Sử Gửi ZNS</div>
    <div id="zalo-history">
      ${(cfg.sendHistory||[]).length ? (cfg.sendHistory||[]).slice(0,20).map(h=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:12px;">
          <div><span style="font-weight:700;color:var(--navy)">${h.studentName||h.phone}</span> <span style="color:#999">· ${h.type||'nhắc học phí'}</span></div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#999">${new Date(h.at).toLocaleString('vi-VN')}</span>
            <span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${h.ok?'#dcfce7':'#fee2e2'};color:${h.ok?'#166534':'#991b1b'}">${h.ok?'Thành công':'Thất bại'}</span>
          </div>
        </div>`).join('') : '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">Chưa có tin nhắn nào được gửi</div>'}
    </div>
  </div>`;
}

async function saveZaloConfig() {
  const body = {
    oaAccessToken: document.getElementById('zalo-token')?.value||'',
    templateId: document.getElementById('zalo-tpl')?.value||'',
    templateIdMakeup: document.getElementById('zalo-tpl-makeup')?.value||''
  };
  const r = await fetch('/api/zalo/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(r.ok) { showToast('Đã lưu cấu hình Zalo!'); renderZaloConfig(); }
  else showToast('Lỗi lưu cấu hình', true);
}

async function sendZaloTest() {
  const phone = document.getElementById('zalo-test-phone')?.value||'';
  const res = document.getElementById('zalo-test-result');
  if (!phone) { if(res) res.innerHTML='<span style="color:red">Vui lòng nhập số điện thoại</span>'; return; }
  if(res) res.innerHTML='<span style="color:#aaa">Đang gửi...</span>';
  try {
    const r = await fetch('/api/zalo/send',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({phone, templateData:{student_name:'Test',subject:'Piano',days_left:'7',end_date:'31/12/2025'}})});
    const d = await r.json();
    if(r.ok) { if(res) res.innerHTML='<span style="color:#166534;font-weight:700;">✓ Gửi thành công!</span>'; }
    else { if(res) res.innerHTML=`<span style="color:red">✗ ${d.error||'Lỗi'}</span>`; }
  } catch(e) { if(res) res.innerHTML=`<span style="color:red">✗ Lỗi kết nối</span>`; }
}

// ════════════════════════════════════════
// AUTO END DATE (hook vào form HV)
// ════════════════════════════════════════
async function autoCalcEndDate() {
  const start = document.getElementById('f-start')?.value;
  const pkg   = document.getElementById('f-package')?.value||document.getElementById('f-pkg')?.value;
  const endEl = document.getElementById('f-end');
  if (!start||!pkg||!endEl) return;
  const m = pkg.match(/(\d+)\s*buổi/);
  if (!m) return;
  const r = await fetch('/api/calc-end-date',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({startDate:start,totalSessions:parseInt(m[1])})}).catch(()=>null);
  if (!r||!r.ok) return;
  const d = await r.json();
  if (d.endDate) { endEl.value = d.endDate; showToast('Tính ngày kết thúc: '+fmtDate(d.endDate)); }
}

function hookAutoEndDate() {
  const start = document.getElementById('f-start');
  const pkg   = document.getElementById('f-package')||document.getElementById('f-pkg');
  if (start) start.addEventListener('change', autoCalcEndDate);
  if (pkg)   pkg.addEventListener('change', autoCalcEndDate);
}

// ════════════════════════════════════════
// OVERRIDE showPage to add new pages
// ════════════════════════════════════════
const _origShowPage = window.showPage;
window.showPage = function(id) {
  const extras = {
    'staff-attendance': renderStaffAttendancePage,
    'student-portal':   renderStudentPortal,
    'audit':            renderAuditPage,
    'zalo':             renderZaloConfig,
  };
  if (extras[id]) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('page-'+id);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n=>{
      const oc=n.getAttribute('onclick')||'';
      if(oc.includes("'"+id+"'")||oc.includes('"'+id+'"')) n.classList.add('active');
    });
    extras[id]();
    return;
  }
  if (typeof _origShowPage === 'function') _origShowPage(id);
};

// ════════════════════════════════════════
// RESPONSIVE CSS (inject once)
// ════════════════════════════════════════
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width:768px) {
      .sidebar { position:fixed!important;left:-270px!important;top:0;height:100vh;z-index:100;transition:left .28s ease;width:260px!important;overflow-y:auto; }
      .sidebar.sb-open { left:0!important; }
      .main { margin-left:0!important;padding:58px 12px 20px!important; }
      .stats-grid { grid-template-columns:repeat(2,1fr)!important; }
      .dash-bottom { grid-template-columns:1fr!important; }
      .form-grid-2 { grid-template-columns:1fr!important; }
      table { font-size:12px; }
      th,td { padding:7px 5px!important; }
    }
    @media (max-width:480px) {
      .stats-grid { grid-template-columns:1fr 1fr!important; }
      .stat-value { font-size:24px!important; }
    }
    #notif-badge { line-height:1; }
    .btn-gold { background:linear-gradient(135deg,var(--gold),#e08515)!important;color:#1a1a1a!important;border:none!important;border-radius:10px!important;padding:9px 16px!important;font-size:13px!important;font-weight:700!important;cursor:pointer!important;font-family:'Be Vietnam Pro',sans-serif!important; }
  `;
  document.head.appendChild(style);
})();

// ════════════════════════════════════════
// INIT HOOK
// ════════════════════════════════════════
const _origInit = window.initAppAfterLogin;
window.initAppAfterLogin = async function() {
  if (typeof _origInit === 'function') _origInit();

  // Load saved theme
  const savedTheme = localStorage.getItem('vs_theme') || 'default';
  applyTheme(savedTheme);

  // Hamburger
  initHamburger();

  // Hook auto end date (delayed to ensure form is rendered)
  setTimeout(hookAutoEndDate, 600);

  const role = window.VS_ROLE;

  // Notifications for staff/admin
  if (['admin','staff'].includes(role)) {
    await checkReminders();
    await loadNotifications();
    setInterval(()=>{ checkReminders(); loadNotifications(); }, 5*60*1000);
  }

  // Student: auto go to portal page
  if (role === 'student') {
    setTimeout(()=>{ window.showPage('student-portal'); }, 300);
  }
};

// ════════════════════════════════════════
// DATE PICKER HOOK – init flatpickr sau mỗi showPage
// ════════════════════════════════════════
const _origShowPageV3 = window.showPage;
window.showPage = function(id) {
  if (typeof _origShowPageV3 === 'function') _origShowPageV3(id);
  setTimeout(() => {
    if (typeof initDatePickers === 'function') initDatePickers();
    fixAccountsLayout();
  }, 80);
};

// Fix accounts page overflow (sidebar che khuất)
function fixAccountsLayout() {
  const page = document.getElementById('page-accounts');
  if (!page) return;
  const table = page.querySelector('table');
  if (table) {
    table.style.minWidth = '600px';
    const wrap = table.closest('.table-wrap') || table.parentElement;
    if (wrap) { wrap.style.overflowX = 'auto'; wrap.style.width = '100%'; }
  }
  // Ensure page has proper left padding on desktop
  if (window.innerWidth > 768) {
    page.style.paddingLeft = '0';
  }
}

// ════════════════════════════════════════
// PAYROLL MODULE – Bảng Lương
// ════════════════════════════════════════
async function renderPayrollPage() {
  const page = document.getElementById('page-payroll');
  if (!page) return;

  const now = new Date();
  const monthStr = now.toISOString().slice(0,7);

  // Load staff attendance
  const r = await fetch(`/api/staff-attendance?month=${monthStr}`).catch(()=>null);
  const attData = r&&r.ok ? await r.json() : [];

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Bảng <span>Lương</span></div>
      <div class="page-sub">Tính lương tự động từ dữ liệu chấm công</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <input type="month" id="pr-month" value="${monthStr}" onchange="recalcPayroll()"
          style="border:1.5px solid var(--cream2);border-radius:8px;padding:7px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;">
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="recalcPayroll()" class="btn btn-gold">🔄 Tính Lại</button>
        <button onclick="exportPayrollCSV()" class="btn" style="background:var(--navy);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📥 Xuất Excel</button>
      </div>
    </div>
    <div id="payroll-content">
      <div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Đang tính...</div></div>
    </div>
  `;

  recalcPayroll();
}

function recalcPayroll() {
  const month = document.getElementById('pr-month')?.value || new Date().toISOString().slice(0,7);
  const content = document.getElementById('payroll-content');
  if (!content) return;

  // Calculate payroll per staff member
  const rows = staff.map(s => {
    // Get attendance for this staff this month
    const att = (window._staffAttCache || []).filter(a =>
      String(a.staffId) === String(s.id) && a.date && a.date.startsWith(month)
    );
    const workDays = att.length;

    // Count late minutes
    let lateMin = 0;
    const manualLateField = 'manualLateMin_' + month;
    if (s[manualLateField] !== undefined) {
      lateMin = s[manualLateField];
    } else {
      att.forEach(a => {
        if (a.checkIn && a.date) {
          const dObj = new Date(a.date);
          const dowMap = ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
          const dayStr = dowMap[dObj.getDay()];
          
          let earliestMin = Infinity;
          classes.forEach(c => {
            if (c.teacher && s.name && c.teacher.toLowerCase().includes(s.name.toLowerCase())) {
              (c.schedule || []).forEach(sch => {
                const sDay = sch.day.replace('ứ ', '');
                const tDay = dayStr.replace('ứ ', '');
                if (sch.day === dayStr || sDay === tDay) {
                  const [ch, cm] = sch.start.split(':').map(Number);
                  const cMin = ch*60 + cm;
                  if (cMin < earliestMin) earliestMin = cMin;
                }
              });
            }
          });
          
          if (earliestMin !== Infinity) {
            const [h,m] = a.checkIn.split(':').map(Number);
            const checkInMin = h*60+m;
            if (checkInMin > earliestMin) {
               lateMin += (checkInMin - earliestMin);
            }
          }
        }
      });
    }

    // Calculate total hours worked
    let totalMin = 0;
    att.forEach(a => {
      if (a.checkIn && a.checkOut) {
        const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
        totalMin += Math.max(0, toMin(a.checkOut) - toMin(a.checkIn));
      }
    });

    // Base salary from staff record
    const baseSalary = Number(s.salary || s.baseSalary || 0);
    const hourlyRate = Number(s.hourlyRate || s.wagePerHour || 0);
    const sessionRate = Number(s.sessionRate || s.wagePerSession || 0);

    // Count teaching sessions from student attendance
    let teachingSessions = 0;
    (attendance || []).forEach(a => {
      if (!a.date || !a.date.startsWith(month)) return;
      const cls = classes.find(c => String(c.id) === String(a.classId));
      if (cls && cls.teacher && cls.teacher.includes(s.name)) {
        // Count present students as sessions taught
        const presentCount = Object.values(a.records||{}).filter(v=>v==='present').length;
        if (presentCount > 0) teachingSessions++;
      }
    });

    // Calculate pay
    let pay = baseSalary;
    if (hourlyRate > 0) pay += Math.round(totalMin / 60 * hourlyRate);
    if (sessionRate > 0) pay += teachingSessions * sessionRate;

    // Late deduction: 10,000 VND per late minute over 15min
    const lateDeduct = lateMin * 1000;
    const finalPay = Math.max(0, pay - lateDeduct);

    return { s, workDays, teachingSessions, totalMin, lateMin, lateDeduct, baseSalary, pay, finalPay };
  });

  if (!rows.length) {
    content.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">Chưa có dữ liệu nhân sự. Vào <b>GV & Nhân Viên</b> để thêm nhân sự trước.</div></div>`;
    return;
  }

  const totalPayroll = rows.reduce((a,r) => a + r.finalPay, 0);

  // Summary stats
  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px;">
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalPayroll)}</div><div class="stat-label">Tổng Chi Lương</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--navy)">${rows.length}</div><div class="stat-label">Nhân Viên</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#22c55e">${rows.reduce((a,r)=>a+r.workDays,0)}</div><div class="stat-label">Tổng Ngày Công</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#ef4444">${rows.reduce((a,r)=>a+r.lateMin,0)}</div><div class="stat-label">Tổng Phút Muộn</div></div>
    </div>
  `;

  window._payrollMonth = month;
  const tableRows = rows.map(({s,workDays,teachingSessions,totalMin,lateMin,lateDeduct,baseSalary,pay,finalPay}) => `
    <tr>
      <td>
        <div style="font-weight:700;color:var(--navy)">${s.name}</div>
        <div style="font-size:11px;color:var(--muted)">${s.role||'–'}</div>
      </td>
      <td style="text-align:center;font-weight:700">${workDays}</td>
      <td style="text-align:center">${teachingSessions}</td>
      <td style="text-align:center">${Math.floor(totalMin/60)}h${totalMin%60?totalMin%60+'p':''}</td>
      <td style="text-align:center;color:${lateMin>0?'#ef4444':'#22c55e'};font-weight:700">
        ${editable(lateMin, 'manualLateMin_' + window._payrollMonth, s.id, 'number')}
      </td>
      <td style="text-align:right;color:var(--navy)">${fmt(baseSalary)}</td>
      <td style="text-align:right;color:#ef4444;font-size:11px">${lateDeduct > 0 ? '-'+fmt(lateDeduct) : '–'}</td>
      <td style="text-align:right;font-weight:800;color:var(--gold);font-size:15px">${fmt(finalPay)}</td>
      <td>
        <button onclick="editStaffSalary(${s.id})"
          style="background:var(--cream2);border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy)">
          ✎ Lương
        </button>
      </td>
    </tr>
  `).join('');

  content.innerHTML = statsHtml + `
    <div class="card">
      <div class="table-wrap">
        <table style="min-width:750px;">
          <thead>
            <tr>
              <th>Nhân Viên</th>
              <th style="text-align:center">Ngày Công</th>
              <th style="text-align:center">Buổi Dạy</th>
              <th style="text-align:center">Tổng Giờ</th>
              <th style="text-align:center">Phút Muộn</th>
              <th style="text-align:right">Lương Cơ Bản</th>
              <th style="text-align:right">Trừ Muộn</th>
              <th style="text-align:right">Thực Lĩnh</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr style="background:var(--cream2);">
              <td colspan="7" style="font-weight:800;color:var(--navy);text-align:right;padding:12px 14px;">TỔNG CHI LƯƠNG:</td>
              <td style="font-weight:800;color:var(--gold);font-size:16px;text-align:right;padding:12px 14px;">${fmt(totalPayroll)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;">
      <div style="font-size:12px;color:#166534;line-height:2;">
        <b>Cách tính lương:</b><br>
        Lương = Lương cơ bản + (Số giờ × Đơn giá/giờ) + (Số buổi dạy × Đơn giá/buổi) − (Phút muộn × 1,000đ/phút)<br>
        Để cài lương cơ bản, đơn giá giờ/buổi: bấm nút <b>✎ Lương</b> cạnh từng nhân viên.
      </div>
    </div>
  `;

  // Cache att data for export
  window._payrollCache = { month, rows };
}

function editStaffSalary(staffId) {
  const s = staff.find(x => x.id === staffId);
  if (!s) return;
  let m = document.getElementById('salary-modal');
  if (!m) { m = document.createElement('div'); m.id = 'salary-modal'; m.onclick = e => { if(e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `<div style="background:#fff;border-radius:20px;padding:26px 22px;max-width:400px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-weight:800;font-size:15px;color:var(--navy)">Cài Lương: ${s.name}</div>
      <button onclick="document.getElementById('salary-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Lương Cơ Bản (đ/tháng)</label>
    <input type="number" id="sal-base" value="${s.salary||s.baseSalary||0}"
      style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Đơn Giá / Giờ (đ)</label>
    <input type="number" id="sal-hourly" value="${s.hourlyRate||s.wagePerHour||0}"
      style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Đơn Giá / Buổi Dạy (đ)</label>
    <input type="number" id="sal-session" value="${s.sessionRate||s.wagePerSession||0}"
      style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:16px;box-sizing:border-box;">
    <button onclick="saveStaffSalary(${staffId})" class="btn btn-gold" style="width:100%">💾 Lưu</button>
  </div>`;
  m.style.display = 'flex';
}

async function saveStaffSalary(staffId) {
  const base    = Number(document.getElementById('sal-base')?.value||0);
  const hourly  = Number(document.getElementById('sal-hourly')?.value||0);
  const session = Number(document.getElementById('sal-session')?.value||0);
  const idx = staff.findIndex(s => s.id === staffId);
  if (idx === -1) return;
  staff[idx].salary = base;
  staff[idx].hourlyRate = hourly;
  staff[idx].sessionRate = session;
  await saveData();
  document.getElementById('salary-modal').style.display = 'none';
  showToast('Đã lưu cài đặt lương!');
  recalcPayroll();
}

function exportPayrollCSV() {
  const cache = window._payrollCache;
  if (!cache) return;
  const BOM = '\uFEFF';
  const q = v => `"${String(v||'').replace(/"/g,'""')}"`;
  let csv = BOM + ['Nhân Viên','Chức Vụ','Ngày Công','Buổi Dạy','Tổng Giờ','Phút Muộn','Lương Cơ Bản','Trừ Muộn','Thực Lĩnh'].map(q).join(',') + '\n';
  cache.rows.forEach(({s,workDays,teachingSessions,totalMin,lateMin,lateDeduct,baseSalary,finalPay}) => {
    csv += [s.name,s.role||'',workDays,teachingSessions,
      Math.floor(totalMin/60)+'h'+(totalMin%60?totalMin%60+'p':''),
      lateMin,baseSalary,lateDeduct,finalPay].map(q).join(',') + '\n';
  });
  const total = cache.rows.reduce((a,r)=>a+r.finalPay,0);
  csv += `"","","","","","","","TỔNG","${total}"\n`;
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `BangLuong_${cache.month}.csv`;
  a.click();
}

// ════════════════════════════════════════
// FACEID SIMULATION (Web Camera)
// ════════════════════════════════════════
let _faceStream = null;
let _faceInterval = null;

function openFaceIDModal(staffId) {
  const s = staff.find(x => String(x.id) === String(staffId));
  if (!s) return;
  let m = document.getElementById('faceid-modal');
  if (!m) { m = document.createElement('div'); m.id = 'faceid-modal'; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `<div style="background:#111;border-radius:20px;padding:24px 20px;max-width:420px;width:100%;font-family:'Be Vietnam Pro',sans-serif;color:#fff;text-align:center;">
    <div style="font-weight:800;font-size:16px;margin-bottom:6px;">Chấm Công FaceID</div>
    <div style="font-size:13px;color:#aaa;margin-bottom:16px;">${s.name}</div>
    <div style="position:relative;border-radius:14px;overflow:hidden;margin-bottom:14px;background:#000;height:260px;display:flex;align-items:center;justify-content:center;">
      <video id="faceid-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;border-radius:14px;"></video>
      <div id="faceid-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:180px;height:220px;border:3px solid var(--gold);border-radius:50%;opacity:.7;"></div>
      </div>
      <div id="faceid-status" style="position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:13px;color:var(--gold);font-weight:700;"></div>
    </div>
    <div id="faceid-result" style="margin-bottom:14px;min-height:24px;font-size:13px;"></div>
    <div style="display:flex;gap:10px;">
      <button id="faceid-scan-btn" onclick="startFaceScan(${staffId})"
        style="flex:1;background:linear-gradient(135deg,var(--gold),#e08515);color:#1a1a1a;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
        📷 Bắt Đầu Quét
      </button>
      <button onclick="closeFaceID()"
        style="flex:1;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
        Đóng
      </button>
    </div>
  </div>`;
  m.style.display = 'flex';
}

async function startFaceScan(staffId) {
  const statusEl = document.getElementById('faceid-status');
  const resultEl = document.getElementById('faceid-result');
  const btnEl    = document.getElementById('faceid-scan-btn');
  const videoEl  = document.getElementById('faceid-video');

  if (statusEl) statusEl.textContent = 'Đang bật camera...';
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Đang quét...'; }

  try {
    _faceStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' }, audio: false });
    if (videoEl) videoEl.srcObject = _faceStream;

    if (statusEl) statusEl.textContent = 'Đặt khuôn mặt vào khung...';

    // Simulate face recognition after 2.5s
    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'Đang nhận diện...';
      setTimeout(async () => {
        // Success simulation
        const now = new Date();
        const timeStr = now.toTimeString().slice(0,5);
        const dateStr = now.toISOString().slice(0,10);

        // Capture photo from video
        let photoData = null;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth || 320; canvas.height = videoEl.videoHeight || 240;
          canvas.getContext('2d').drawImage(videoEl, 0, 0);
          photoData = canvas.toDataURL('image/jpeg', 0.8);
        } catch(e) {}

        // Save attendance with photo
        const r = await fetch('/api/staff-attendance', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ staffId, date: dateStr, checkIn: timeStr, method: 'faceid', note: 'Chấm công FaceID tự động', photo: photoData })
        });

        if (r.ok) {
          if (statusEl) { statusEl.style.color = '#22c55e'; statusEl.textContent = '✓ Nhận diện thành công!'; }
          if (resultEl) resultEl.innerHTML = `<span style="color:#22c55e;font-weight:700;">Chấm công lúc ${timeStr} – ${dateStr}</span>`;
          if (btnEl) { btnEl.textContent = '✓ Hoàn thành'; btnEl.style.background = '#22c55e'; }
          showToast('FaceID: Chấm công thành công!');
          // Auto close after 2s
          setTimeout(() => { closeFaceID(); renderStaffAttendancePage(); }, 2000);
        } else {
          if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.textContent = '✗ Lỗi lưu dữ liệu'; }
          if (btnEl) { btnEl.disabled = false; btnEl.textContent = '📷 Thử Lại'; }
        }
        stopCamera();
      }, 1500);
    }, 2500);

  } catch(e) {
    if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.textContent = 'Không thể truy cập camera'; }
    if (resultEl) resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px;">Trình duyệt cần quyền truy cập camera. Hãy cho phép và thử lại.</span>`;
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = '📷 Thử Lại'; }
  }
}

function stopCamera() {
  if (_faceStream) {
    _faceStream.getTracks().forEach(t => t.stop());
    _faceStream = null;
  }
}

function closeFaceID() {
  stopCamera();
  const m = document.getElementById('faceid-modal');
  if (m) m.style.display = 'none';
}

// ════════════════════════════════════════
// HOOK: Override renderStaffAttendancePage
// to add FaceID button + load payroll cache
// ════════════════════════════════════════
const _origRenderSA = window.renderStaffAttendancePage;
window.renderStaffAttendancePage = async function() {
  await _origRenderSA();
  // Cache staff att data for payroll
  const month = document.getElementById('sa-month')?.value || new Date().toISOString().slice(0,7);
  const r = await fetch(`/api/staff-attendance?month=${month}`).catch(()=>null);
  window._staffAttCache = r&&r.ok ? await r.json() : [];
  // Add FaceID column to each row in overview
  addFaceIDButtons();
};

function addFaceIDButtons() {
  // Add FaceID button next to check-in modal button
  const btn = document.querySelector('#staff-att-content .btn.btn-gold');
  if (btn && !document.getElementById('faceid-quick-btn')) {
    const faceBtn = document.createElement('button');
    faceBtn.id = 'faceid-quick-btn';
    faceBtn.className = 'btn';
    faceBtn.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
    faceBtn.innerHTML = '📸 FaceID';
    faceBtn.onclick = () => openFaceIDPicker();
    btn.parentElement.appendChild(faceBtn);
  }
}

function openFaceIDPicker() {
  // Show staff picker then open FaceID
  let m = document.getElementById('faceid-picker');
  if (!m) { m = document.createElement('div'); m.id = 'faceid-picker'; m.onclick = e => { if(e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId;

  if (role === 'teacher' && myStaffId) {
    m.style.display = 'none';
    openFaceIDModal(myStaffId);
    return;
  }

  const options = staff.map(s =>
    `<div onclick="document.getElementById('faceid-picker').style.display='none';openFaceIDModal(${s.id})"
      style="padding:12px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:10px;transition:.15s;"
      onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='#fff'">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0">${s.name.charAt(0)}</div>
      <div><div style="font-weight:700;font-size:13px;color:var(--navy)">${s.name}</div><div style="font-size:11px;color:var(--muted)">${s.role||''}</div></div>
    </div>`
  ).join('');

  m.innerHTML = `<div style="background:#fff;border-radius:18px;width:320px;max-height:420px;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.2);font-family:'Be Vietnam Pro',sans-serif;">
    <div style="padding:14px 16px;border-bottom:1px solid #eee;font-weight:800;color:var(--navy);font-size:14px;position:sticky;top:0;background:#fff;display:flex;justify-content:space-between;align-items:center;">
      Chọn Nhân Viên – FaceID
      <button onclick="document.getElementById('faceid-picker').style.display='none'" style="background:none;border:none;font-size:16px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    ${options || '<div style="padding:20px;text-align:center;color:var(--muted)">Chưa có nhân sự</div>'}
  </div>`;
  m.style.display = 'flex';
}

// ════════════════════════════════════════
// HOOK showPage for payroll
// ════════════════════════════════════════
const _origShowPagePayroll = window.showPage;
window.showPage = function(id) {
  if (id === 'payroll') {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('page-payroll');
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => {
      const oc = n.getAttribute('onclick')||'';
      if (oc.includes("'payroll'")) n.classList.add('active');
    });
    renderPayrollPage();
    return;
  }
  if (typeof _origShowPagePayroll === 'function') _origShowPagePayroll(id);
};

// ════════════════════════════════════════
// PAYROLL v2 – Thêm cột: Trừ Lỗi, STK, Ghi Chú
// ════════════════════════════════════════
// Override recalcPayroll to add new columns
const _origRecalcPayroll = window.recalcPayroll;
window.recalcPayroll = function() {
  const month = document.getElementById('pr-month')?.value || new Date().toISOString().slice(0,7);
  const content = document.getElementById('payroll-content');
  if (!content) return;

  const rows = staff.map(s => {
    const att = (window._staffAttCache || []).filter(a =>
      String(a.staffId) === String(s.id) && a.date && a.date.startsWith(month)
    );
    const workDays = att.length;
    let lateMin = 0;
    const manualLateField = 'manualLateMin_' + month;
    if (s[manualLateField] !== undefined) {
      lateMin = s[manualLateField];
    } else {
      att.forEach(a => {
        if (a.checkIn && a.date) {
          const dObj = new Date(a.date);
          const dowMap = ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
          const dayStr = dowMap[dObj.getDay()];
          
          let earliestMin = Infinity;
          classes.forEach(c => {
            if (c.teacher && s.name && c.teacher.toLowerCase().includes(s.name.toLowerCase())) {
              (c.schedule || []).forEach(sch => {
                const sDay = sch.day.replace('ứ ', '');
                const tDay = dayStr.replace('ứ ', '');
                if (sch.day === dayStr || sDay === tDay) {
                  const [ch, cm] = sch.start.split(':').map(Number);
                  const cMin = ch*60 + cm;
                  if (cMin < earliestMin) earliestMin = cMin;
                }
              });
            }
          });
          
          if (earliestMin !== Infinity) {
            const [h,m] = a.checkIn.split(':').map(Number);
            const checkInMin = h*60+m;
            if (checkInMin > earliestMin) {
               lateMin += (checkInMin - earliestMin);
            }
          }
        }
      });
    }
    let totalMin = 0;
    att.forEach(a => {
      if (a.checkIn && a.checkOut) {
        const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
        totalMin += Math.max(0, toMin(a.checkOut) - toMin(a.checkIn));
      }
    });
    const baseSalary    = Number(s.salary || s.baseSalary || 0);
    const hourlyRate    = Number(s.hourlyRate || 0);
    const sessionRate   = Number(s.sessionRate || 0);
    const customDeduct  = Number(s.customDeduct || 0); // cột Trừ Lỗi
    let teachingSessions = 0;
    (attendance || []).forEach(a => {
      if (!a.date || !a.date.startsWith(month)) return;
      const cls = classes.find(c => String(c.id) === String(a.classId));
      if (cls && cls.teacher && cls.teacher.includes(s.name)) {
        if (Object.values(a.records||{}).filter(v=>v==='present').length > 0) teachingSessions++;
      }
    });
    let pay = baseSalary;
    if (hourlyRate > 0) pay += Math.round(totalMin / 60 * hourlyRate);
    if (sessionRate > 0) pay += teachingSessions * sessionRate;
    const lateDeduct = lateMin * 1000;
    const finalPay = Math.max(0, pay - lateDeduct - customDeduct);
    return { s, workDays, teachingSessions, totalMin, lateMin, lateDeduct, customDeduct, baseSalary, pay, finalPay };
  });

  if (!rows.length) {
    content.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">Chưa có nhân sự.</div></div>`;
    return;
  }
  const totalPayroll = rows.reduce((a,r) => a + r.finalPay, 0);

  const statsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
    <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalPayroll)}</div><div class="stat-label">Tổng Chi Lương</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--navy)">${rows.length}</div><div class="stat-label">Nhân Viên</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#22c55e">${rows.reduce((a,r)=>a+r.workDays,0)}</div><div class="stat-label">Tổng Ngày Công</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#ef4444">${rows.reduce((a,r)=>a+r.lateMin,0)}</div><div class="stat-label">Tổng Phút Muộn</div></div>
  </div>`;

  window._payrollMonth = month;
  const tableRows = rows.map(({s,workDays,teachingSessions,totalMin,lateMin,lateDeduct,customDeduct,baseSalary,pay,finalPay}) => `
    <tr>
      <td><div style="font-weight:700;color:var(--navy)">${s.name}</div><div style="font-size:11px;color:var(--muted)">${s.role||'–'}</div></td>
      <td style="text-align:center;font-weight:700">${workDays}</td>
      <td style="text-align:center">${teachingSessions}</td>
      <td style="text-align:center">${Math.floor(totalMin/60)}h${totalMin%60?totalMin%60+'p':''}</td>
      <td style="text-align:center;color:${lateMin>0?'#ef4444':'#22c55e'};font-weight:700">
        ${editable(lateMin, 'manualLateMin_' + window._payrollMonth, s.id, 'number')}
      </td>
      <td style="text-align:right;color:var(--navy)">${fmt(baseSalary)}</td>
      <td style="text-align:right;color:#ef4444;font-size:11px">${lateDeduct>0?'-'+fmt(lateDeduct):'–'}</td>
      <td style="text-align:right;color:#ef4444;font-size:11px">
        <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;">
          <span>${customDeduct>0?'-'+fmt(customDeduct):'–'}</span>
          <button onclick="editCustomDeduct(${s.id})"
            style="background:var(--cream2);border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy)">✎</button>
        </div>
      </td>
      <td style="text-align:center;font-size:11px;color:#555;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
          <span title="${s.bankAccount||''}">${s.bankAccount||'–'}</span>
          <button onclick="editBankInfo(${s.id})"
            style="background:var(--cream2);border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy)">✎</button>
        </div>
      </td>
      <td style="font-size:11px;color:#666;max-width:120px">
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px" title="${s.payrollNote||''}">${s.payrollNote||'–'}</span>
          <button onclick="editPayrollNote(${s.id})"
            style="background:var(--cream2);border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy)">✎</button>
        </div>
      </td>
      <td style="text-align:right;font-weight:800;color:var(--gold);font-size:14px;white-space:nowrap">${fmt(finalPay)}</td>
      <td>
        <button onclick="editStaffSalary(${s.id})"
          style="background:var(--cream2);border:none;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy)">✎ Lương</button>
      </td>
    </tr>`).join('');

  content.innerHTML = statsHtml + `<div class="card"><div class="table-wrap"><table style="min-width:1000px;">
    <thead><tr>
      <th>Nhân Viên</th>
      <th style="text-align:center">Ngày Công</th>
      <th style="text-align:center">Buổi Dạy</th>
      <th style="text-align:center">Tổng Giờ</th>
      <th style="text-align:center">Phút Muộn</th>
      <th style="text-align:right">Lương CB</th>
      <th style="text-align:right">Trừ Muộn</th>
      <th style="text-align:right">Trừ Lỗi</th>
      <th style="text-align:center">STK Ngân Hàng</th>
      <th>Ghi Chú</th>
      <th style="text-align:right">Thực Lĩnh</th>
      <th></th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
    <tfoot><tr style="background:var(--cream2);">
      <td colspan="10" style="font-weight:800;color:var(--navy);text-align:right;padding:12px 14px;">TỔNG CHI LƯƠNG:</td>
      <td style="font-weight:800;color:var(--gold);font-size:16px;text-align:right;padding:12px 14px;">${fmt(totalPayroll)}</td>
      <td></td>
    </tr></tfoot>
  </table></div></div>`;

  window._payrollCache = { month, rows };
};

// Edit custom deduct
function editCustomDeduct(staffId) {
  const s = staff.find(x=>x.id===staffId); if(!s) return;
  const val = prompt(`Trừ lỗi cho ${s.name} (nhập số tiền VNĐ):`, s.customDeduct||0);
  if (val === null) return;
  s.customDeduct = Math.max(0, Number(val)||0);
  saveData().then(()=>{ showToast('Đã lưu!'); recalcPayroll(); });
}

// Edit bank info
function editBankInfo(staffId) {
  const s = staff.find(x=>x.id===staffId); if(!s) return;
  const val = prompt(`Số tài khoản ngân hàng của ${s.name}:`, s.bankAccount||'');
  if (val === null) return;
  s.bankAccount = val.trim();
  saveData().then(()=>{ showToast('Đã lưu STK!'); recalcPayroll(); });
}

// Edit payroll note
function editPayrollNote(staffId) {
  const s = staff.find(x=>x.id===staffId); if(!s) return;
  const val = prompt(`Ghi chú lương cho ${s.name}:`, s.payrollNote||'');
  if (val === null) return;
  s.payrollNote = val.trim();
  saveData().then(()=>{ showToast('Đã lưu ghi chú!'); recalcPayroll(); });
}

// Override exportPayrollCSV for new columns
window.exportPayrollCSV = function() {
  const cache = window._payrollCache; if(!cache) return;
  const BOM='\uFEFF';
  const q=v=>`"${String(v||'').replace(/"/g,'""')}"`;
  let csv=BOM+['Nhân Viên','Chức Vụ','Ngày Công','Buổi Dạy','Tổng Giờ','Phút Muộn','Lương CB','Trừ Muộn','Trừ Lỗi','STK Ngân Hàng','Ghi Chú','Thực Lĩnh'].map(q).join(',')+'\n';
  cache.rows.forEach(({s,workDays,teachingSessions,totalMin,lateMin,lateDeduct,customDeduct,baseSalary,finalPay})=>{
    csv+=[s.name,s.role||'',workDays,teachingSessions,
      Math.floor(totalMin/60)+'h'+(totalMin%60?totalMin%60+'p':''),
      lateMin,baseSalary,lateDeduct,customDeduct||0,s.bankAccount||'',s.payrollNote||'',finalPay].map(q).join(',')+'\n';
  });
  const total=cache.rows.reduce((a,r)=>a+r.finalPay,0);
  csv+=`"","","","","","","","","","","TỔNG","${total}"\n`;
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`BangLuong_${cache.month}.csv`; a.click();
};

// ════════════════════════════════════════
// STAFF ATTENDANCE v2 – Check-in / Check-out + Photo
// ════════════════════════════════════════
// Override openCheckInModal to support check-in & check-out + photo
window.openCheckInModal = function() {
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId || null;
  let m = document.getElementById('checkin-modal');
  if (!m) { m=document.createElement('div');m.id='checkin-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const now = new Date();
  const timeNow = now.toTimeString().slice(0,5);
  const dateNow = now.toISOString().slice(0,10);

  let staffSel = '';
  if (role==='teacher'&&myStaffId) {
    const me=staff.find(s=>String(s.id)===String(myStaffId));
    staffSel=`<input type="hidden" id="ci-staff" value="${myStaffId}"><div style="font-size:14px;font-weight:700;color:var(--navy);padding:8px 0 12px;">${me?me.name:'Tôi'}</div>`;
  } else {
    staffSel=`<select id="ci-staff" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:12px;box-sizing:border-box;">
      ${staff.map(s=>`<option value="${s.id}">${s.name} – ${s.role||''}</option>`).join('')}
    </select>`;
  }

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:440px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-weight:800;font-size:16px;color:var(--navy)">Chấm Công</div>
      <button onclick="document.getElementById('checkin-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Nhân Viên</label>
    ${staffSel}
    <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ngày</label>
        <input type="date" id="ci-date" value="${dateNow}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:#22c55e;display:block;margin-bottom:4px;">🟢 Check-in (Giờ Vào)</label>
        <input type="time" id="ci-in" value="${timeNow}" style="width:100%;border:1.5px solid #22c55e;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:#ef4444;display:block;margin-bottom:4px;">🔴 Check-out (Giờ Ra)</label>
        <input type="time" id="ci-out" style="width:100%;border:1.5px solid #ef4444;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Phương Thức</label>
        <select id="ci-method" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
          <option value="manual">Thủ Công</option>
          <option value="faceid">FaceID</option>
          <option value="photo">Chụp Ảnh</option>
        </select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ghi Chú</label>
        <input type="text" id="ci-note" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;" placeholder="Ghi chú...">
      </div>
    </div>
    <!-- Photo upload -->
    <div style="margin-bottom:14px;">
      <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:6px;">📷 Ảnh Chấm Công (tùy chọn)</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <label style="flex:1;background:var(--cream);border:1.5px dashed var(--cream2);border-radius:10px;padding:10px;text-align:center;cursor:pointer;font-size:12px;color:var(--muted);">
          <input type="file" id="ci-photo" accept="image/*" capture="environment" style="display:none;" onchange="previewCIPhoto(this)">
          📁 Chọn ảnh hoặc chụp
        </label>
        <button onclick="captureCIPhoto()" style="background:var(--navy);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;white-space:nowrap;">
          📸 Mở Camera
        </button>
      </div>
      <div id="ci-photo-preview" style="margin-top:8px;display:none;">
        <img id="ci-photo-img" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;border:2px solid var(--cream2);">
        <button onclick="clearCIPhoto()" style="margin-top:4px;background:#fee2e2;border:none;border-radius:6px;padding:3px 10px;font-size:11px;color:#991b1b;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">✕ Xóa ảnh</button>
      </div>
      <!-- Live camera for photo capture -->
      <div id="ci-camera-wrap" style="display:none;margin-top:8px;">
        <video id="ci-video" autoplay playsinline style="width:100%;border-radius:10px;max-height:200px;object-fit:cover;"></video>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button onclick="snapCIPhoto()" style="flex:1;background:var(--gold);color:#1a1a1a;border:none;border-radius:10px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📸 Chụp</button>
          <button onclick="stopCICamera()" style="flex:1;background:var(--cream2);color:var(--navy);border:none;border-radius:10px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
        </div>
        <canvas id="ci-canvas" style="display:none;"></canvas>
      </div>
    </div>
    <button onclick="submitCheckIn()" class="btn btn-gold" style="width:100%;">💾 Lưu Chấm Công</button>
  </div>`;
  m.style.display='flex';
};

let _ciStream=null;
window._ciPhotoDataURL=null;

function previewCIPhoto(input) {
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    window._ciPhotoDataURL=e.target.result;
    document.getElementById('ci-photo-img').src=e.target.result;
    document.getElementById('ci-photo-preview').style.display='block';
  };
  reader.readAsDataURL(file);
}

async function captureCIPhoto() {
  const wrap=document.getElementById('ci-camera-wrap');
  const video=document.getElementById('ci-video');
  if (!wrap||!video) return;
  try {
    _ciStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    video.srcObject=_ciStream;
    wrap.style.display='block';
  } catch(e) { showToast('Không thể mở camera: '+e.message,true); }
}

function snapCIPhoto() {
  const video=document.getElementById('ci-video');
  const canvas=document.getElementById('ci-canvas');
  if (!video||!canvas) return;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  const dataURL=canvas.toDataURL('image/jpeg',0.8);
  window._ciPhotoDataURL=dataURL;
  document.getElementById('ci-photo-img').src=dataURL;
  document.getElementById('ci-photo-preview').style.display='block';
  stopCICamera();
}

function stopCICamera() {
  if (_ciStream) { _ciStream.getTracks().forEach(t=>t.stop()); _ciStream=null; }
  const wrap=document.getElementById('ci-camera-wrap');
  if (wrap) wrap.style.display='none';
}

function clearCIPhoto() {
  window._ciPhotoDataURL=null;
  document.getElementById('ci-photo-preview').style.display='none';
  document.getElementById('ci-photo-img').src='';
  const inp=document.getElementById('ci-photo');
  if(inp) inp.value='';
}

// Override submitCheckIn to include photo
window.submitCheckIn = async function() {
  const staffId=document.getElementById('ci-staff')?.value;
  const date=document.getElementById('ci-date')?.value;
  const checkIn=document.getElementById('ci-in')?.value;
  const checkOut=document.getElementById('ci-out')?.value||null;
  const method=document.getElementById('ci-method')?.value||'manual';
  const note=document.getElementById('ci-note')?.value||'';
  if(!staffId||!date||!checkIn){showToast('Vui lòng điền nhân viên, ngày và giờ vào',true);return;}
  try {
    const body={staffId,date,checkIn,checkOut,method,note,photo:window._ciPhotoDataURL||null};
    const r=await fetch('/api/staff-attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){showToast(d.error||'Lỗi lưu',true);return;}
    showToast('Đã lưu chấm công!');
    window._ciPhotoDataURL=null;
    stopCICamera();
    document.getElementById('checkin-modal').style.display='none';
    renderStaffAttendancePage();
  } catch(e){showToast('Lỗi kết nối',true);}
};

// Show photo in detail tab
const _origSwitchSATab=window.switchSATab;
window.switchSATab=function(tab) {
  if(typeof _origSwitchSATab==='function') _origSwitchSATab(tab);
  if(tab==='detail') {
    // Add photo column if not present
    setTimeout(()=>{
      const headers=document.querySelectorAll('#page-staff-attendance th');
      if(headers.length && ![...headers].some(h=>h.textContent==='Ảnh')) {
        // Re-render detail with photo
        renderDetailWithPhoto();
      }
    },100);
  }
};

function renderDetailWithPhoto() {
  const month=(document.getElementById('sa-month')||{value:new Date().toISOString().slice(0,7)}).value;
  const filtered=(window._staffAttCache||[]).filter(a=>a.date&&a.date.startsWith(month));
  const tc=document.getElementById('sa-tab-content'); if(!tc) return;
  const sorted=[...filtered].sort((a,b)=>a.date>b.date?-1:1);
  const rows=sorted.map(a=>{
    const s=staff.find(x=>String(x.id)===String(a.staffId));
    let lateMin=0;
    if(a.checkIn){const[h,m]=a.checkIn.split(':').map(Number);const diff=(h*60+m)-8*60;if(diff>15)lateMin=diff-15;}
    const _coData = encodeURIComponent(JSON.stringify({staffId:a.staffId,date:a.date,checkIn:a.checkIn||'',note:a.note||''}));
    const checkOutHtml = a.checkOut
      ? `<span style="color:#ef4444;font-weight:700;font-size:13px;">${a.checkOut}</span>`
      : `<button onclick="quickCheckOut(JSON.parse(decodeURIComponent('${_coData}')))" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">🔴 Check-out</button>`;
    const photoHtml = photoSrc ? `<img src="${photoSrc}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #eee;cursor:pointer;" onclick="viewPhoto('${photoSrc}')" onerror="this.style.display='none'">` : '<span style="color:#ccc;font-size:11px;">–</span>';
    return `<tr>
      <td>${fmtDate(a.date)}</td>
      <td><div style="font-weight:600">${s?s.name:a.staffId}</div></td>
      <td style="font-weight:700;color:${lateMin>0?'#ef4444':'#22c55e'}">${a.checkIn||'–'}${lateMin>0?` <span style="font-size:10px">(muộn ${lateMin}p)</span>`:''}</td>
      <td>${checkOutHtml}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--cream2)">${a.method==='faceid'?'FaceID':a.method==='photo'?'Chụp Ảnh':'Thủ công'}</span></td>
      <td>${photoHtml}</td>
      <td style="font-size:11px;color:var(--muted)">${a.note||'–'}</td>
    </tr>`;
  }).join('');
  tc.innerHTML=`<div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Ngày</th><th>Nhân Viên</th><th>Check-in</th><th>Check-out</th><th>Phương Thức</th><th>Ảnh</th><th>Ghi Chú</th></tr></thead>
    <tbody>${rows||'<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu</td></tr>'}</tbody>
  </table></div></div>`;
}

async function quickCheckOut(attObj) {
  // attObj is the attendance record
  const now=new Date().toTimeString().slice(0,5);
  const a=typeof attObj==='string'?JSON.parse(attObj):attObj;
  try {
    const r=await fetch('/api/staff-attendance',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({staffId:a.staffId,date:a.date,checkIn:a.checkIn,checkOut:now,method:a.method,note:a.note})});
    if(r.ok){showToast(`Check-out lúc ${now}!`);renderStaffAttendancePage();}
    else showToast('Lỗi check-out',true);
  } catch(e){showToast('Lỗi kết nối',true);}
}

function viewPhoto(url) {
  let m=document.getElementById('photo-view-modal');
  if(!m){m=document.createElement('div');m.id='photo-view-modal';m.onclick=()=>m.style.display='none';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;cursor:pointer;';
  m.innerHTML=`<div style="text-align:center;"><img src="${url}" style="max-width:90vw;max-height:85vh;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,.5);"><div style="color:#aaa;font-size:12px;margin-top:10px;">Bấm để đóng</div></div>`;
  m.style.display='flex';
}

// ════════════════════════════════════════
// FACEID CHECKOUT
// ════════════════════════════════════════
function openFaceIDCheckout(staffId) {
  const s = staff.find(x => String(x.id) === String(staffId));
  if (!s) return;
  let m = document.getElementById('faceid-out-modal');
  if (!m) { m = document.createElement('div'); m.id = 'faceid-out-modal'; m.onclick = e => { if(e.target===m) m.style.display='none'; }; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `<div style="background:#111;border-radius:20px;padding:24px 20px;max-width:420px;width:100%;font-family:'Be Vietnam Pro',sans-serif;color:#fff;text-align:center;">
    <div style="font-weight:800;font-size:16px;margin-bottom:4px;">Check-out FaceID</div>
    <div style="font-size:13px;color:#ef4444;margin-bottom:16px;">${s.name} – Giờ Ra</div>
    <div style="position:relative;border-radius:14px;overflow:hidden;margin-bottom:14px;background:#000;height:240px;display:flex;align-items:center;justify-content:center;">
      <video id="faceid-out-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;border-radius:14px;"></video>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:180px;height:220px;border:3px solid #ef4444;border-radius:50%;opacity:.7;"></div>
      </div>
      <div id="faceid-out-status" style="position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:13px;color:#ef4444;font-weight:700;"></div>
    </div>
    <div id="faceid-out-result" style="margin-bottom:14px;min-height:24px;font-size:13px;"></div>
    <div style="display:flex;gap:10px;">
      <button onclick="startFaceOutScan(${staffId})"
        style="flex:1;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
        📷 Quét Check-out
      </button>
      <button onclick="closeFaceIDOut()"
        style="flex:1;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
        Đóng
      </button>
    </div>
  </div>`;
  m.style.display = 'flex';
}

let _faceOutStream = null;
async function startFaceOutScan(staffId) {
  const statusEl = document.getElementById('faceid-out-status');
  const resultEl = document.getElementById('faceid-out-result');
  const videoEl  = document.getElementById('faceid-out-video');
  if (statusEl) statusEl.textContent = 'Đang bật camera...';
  try {
    _faceOutStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    if (videoEl) videoEl.srcObject = _faceOutStream;
    if (statusEl) statusEl.textContent = 'Đặt khuôn mặt vào khung...';
    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'Đang nhận diện...';
      setTimeout(async () => {
        // Capture photo
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
        canvas.getContext('2d').drawImage(videoEl,0,0);
        const photoData = canvas.toDataURL('image/jpeg',0.8);

        const now = new Date();
        const timeStr = now.toTimeString().slice(0,5);
        const dateStr = now.toISOString().slice(0,10);

        // Find today's check-in
        const todayAtt = (window._staffAttCache||[]).find(a =>
          String(a.staffId)===String(staffId) && a.date===dateStr && a.checkIn && !a.checkOut
        );

        const r = await fetch('/api/staff-attendance', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            staffId, date: dateStr,
            checkIn: todayAtt ? todayAtt.checkIn : null,
            checkOut: timeStr,
            method: 'faceid',
            note: 'Check-out FaceID tự động',
            photo: photoData
          })
        });
        if (r.ok) {
          if (statusEl) { statusEl.style.color='#22c55e'; statusEl.textContent='✓ Check-out thành công!'; }
          if (resultEl) resultEl.innerHTML = `<span style="color:#22c55e;font-weight:700;">Ra lúc ${timeStr}</span>`;
          showToast('FaceID Check-out thành công!');
          if (_faceOutStream) { _faceOutStream.getTracks().forEach(t=>t.stop()); _faceOutStream=null; }
          setTimeout(()=>{ closeFaceIDOut(); renderStaffAttendancePage(); }, 1800);
        } else {
          if (statusEl) { statusEl.style.color='#ef4444'; statusEl.textContent='✗ Lỗi lưu'; }
        }
      }, 1500);
    }, 2500);
  } catch(e) {
    if (statusEl) { statusEl.style.color='#ef4444'; statusEl.textContent='Không thể mở camera'; }
  }
}

function closeFaceIDOut() {
  if (_faceOutStream) { _faceOutStream.getTracks().forEach(t=>t.stop()); _faceOutStream=null; }
  const m = document.getElementById('faceid-out-modal');
  if (m) m.style.display='none';
}

// Add checkout FaceID button to attendance page
const _origAddFaceIDButtons = window.addFaceIDButtons;
window.addFaceIDButtons = function() {
  if (typeof _origAddFaceIDButtons === 'function') _origAddFaceIDButtons();
  const area = document.querySelector('#staff-att-content .btn.btn-gold')?.parentElement;
  if (area && !document.getElementById('faceid-out-quick-btn')) {
    const btn = document.createElement('button');
    btn.id = 'faceid-out-quick-btn';
    btn.style.cssText = 'background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
    btn.innerHTML = '📸 FaceID Check-out';
    btn.onclick = () => openFaceIDOutPicker();
    area.appendChild(btn);
  }
};

function openFaceIDOutPicker() {
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId;
  if (role==='teacher'&&myStaffId) { openFaceIDCheckout(myStaffId); return; }
  let m = document.getElementById('faceid-out-picker');
  if (!m) { m=document.createElement('div');m.id='faceid-out-picker';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  const options = staff.map(s =>
    `<div onclick="document.getElementById('faceid-out-picker').style.display='none';openFaceIDCheckout(${s.id})"
      style="padding:12px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:10px;"
      onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='#fff'">
      <div style="width:36px;height:36px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">${s.name.charAt(0)}</div>
      <div><div style="font-weight:700;font-size:13px;color:var(--navy)">${s.name}</div><div style="font-size:11px;color:var(--muted)">${s.role||''}</div></div>
    </div>`).join('');
  m.innerHTML=`<div style="background:#fff;border-radius:18px;width:320px;max-height:400px;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.2);font-family:'Be Vietnam Pro',sans-serif;">
    <div style="padding:14px 16px;border-bottom:1px solid #eee;font-weight:800;color:var(--navy);font-size:14px;position:sticky;top:0;background:#fff;display:flex;justify-content:space-between;">
      FaceID Check-out – Chọn NV
      <button onclick="document.getElementById('faceid-out-picker').style.display='none'" style="background:none;border:none;font-size:16px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    ${options||'<div style="padding:20px;text-align:center;color:var(--muted)">Chưa có nhân sự</div>'}
  </div>`;
  m.style.display='flex';
}

// ════════════════════════════════════════
// TKB – Click ô lớp → mở điểm danh
// ════════════════════════════════════════
// Override renderSchedule post-render to add click handlers
const _origRenderSchedule = window.renderSchedule;
window.renderSchedule = function() {
  if (typeof _origRenderSchedule === 'function') _origRenderSchedule();
  // Add click on class cells
  setTimeout(() => {
    document.querySelectorAll('[data-classid]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const cid = el.dataset.classid;
        openQuickAttendance(Number(cid));
      });
    });
  }, 100);
};

function openQuickAttendance(classId) {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return;
  const classStudents = students.filter(s => Number(s.classid) === Number(classId));
  const today = new Date().toISOString().slice(0,10);

  let m = document.getElementById('quick-att-modal');
  if (!m) { m=document.createElement('div');m.id='quick-att-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const studentRows = classStudents.length
    ? classStudents.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">${s.name}</div>
        <div style="display:flex;gap:6px;">
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;">
            <input type="radio" name="att_${s.id}" value="present" checked style="accent-color:#22c55e;">
            <span style="color:#22c55e;font-weight:700;">Có mặt</span>
          </label>
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;">
            <input type="radio" name="att_${s.id}" value="absent" style="accent-color:#ef4444;">
            <span style="color:#ef4444;font-weight:700;">Vắng</span>
          </label>
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;">
            <input type="radio" name="att_${s.id}" value="late" style="accent-color:#f59e0b;">
            <span style="color:#f59e0b;font-weight:700;">Muộn</span>
          </label>
        </div>
      </div>`).join('')
    : '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">Lớp này chưa có học viên</div>';

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:500px;width:100%;font-family:'Be Vietnam Pro',sans-serif;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="font-weight:800;font-size:15px;color:var(--navy);">Điểm Danh Nhanh</div>
      <button onclick="document.getElementById('quick-att-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">${cls.name} · ${cls.subject}</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px;">📅 ${new Date().toLocaleDateString('vi-VN')} · ${classStudents.length} học viên</div>
    <div id="quick-att-students">${studentRows}</div>
    ${classStudents.length ? `
    <div style="margin-top:16px;display:flex;gap:8px;">
      <button onclick="submitQuickAttendance(${classId},'${today}')" class="btn btn-gold" style="flex:1;">✅ Lưu Điểm Danh</button>
      <button onclick="document.getElementById('quick-att-modal').style.display='none'"
        style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>` : ''}
  </div>`;
  m.style.display='flex';
}

async function submitQuickAttendance(classId, date) {
  const classStudents = students.filter(s => Number(s.classid) === Number(classId));
  const records = {};
  classStudents.forEach(s => {
    const checked = document.querySelector(`input[name="att_${s.id}"]:checked`);
    records[String(s.id)] = checked ? checked.value : 'present';
  });

  // Find or create attendance record
  let existing = attendance.find(a => String(a.classId)===String(classId) && a.date===date);
  if (existing) {
    existing.records = {...existing.records, ...records};
  } else {
    attendance.push({ id: Date.now(), classId, date, records });
  }

  // Auto-create makeup for absent students
  classStudents.forEach(s => {
    if (records[String(s.id)] === 'absent') {
      const alreadyMakeup = makeups.some(mk => String(mk.studentId)===String(s.id) && mk.absentDate===date);
      if (!alreadyMakeup) {
        makeups.push({ id: Date.now()+Math.random(), studentId: s.id, studentName: s.name, classId, absentDate: date, makeupDate: '', status: 'pending', note: 'Tự động từ điểm danh TKB' });
      }
    }
  });

  await save();
  document.getElementById('quick-att-modal').style.display='none';
  showToast(`Đã điểm danh ${classStudents.length} học viên!`);
}

// Hook data-classid onto TKB cells after render
const _renderScheduleWithData = window.renderSchedule;
window.renderSchedule = function() {
  if (typeof _renderScheduleWithData === 'function') _renderScheduleWithData();
  // Post-process: add data-classid to tkb cells for click
  setTimeout(() => {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    // Re-inject with data attributes
    grid.querySelectorAll('td > div').forEach(div => {
      const code = div.querySelector('div')?.textContent;
      if (!code) return;
      const cls = classes.find(c => code.includes(c.name) || code.includes(c.code));
      if (cls) {
        div.dataset.classid = cls.id;
        div.title = `Bấm để điểm danh ${cls.name}`;
        div.style.cursor = 'pointer';
        div.style.transition = 'opacity .15s';
        div.onmouseover = () => div.style.opacity = '.8';
        div.onmouseout  = () => div.style.opacity = '1';
        div.onclick = (e) => { e.stopPropagation(); openQuickAttendance(cls.id); };
      }
    });
  }, 150);
};

// ════════════════════════════════════════
// STAFF BANK QR + PHOTO
// ════════════════════════════════════════
async function showStaffBankQR(staffId) {
  const s = staff.find(x => x.id === staffId);
  if (!s) return;
  if (!s.bankAccount) {
    showToast('Chưa có số tài khoản ngân hàng!', true);
    editBankInfo(staffId);
    return;
  }
  // Fetch QR
  const r = await fetch(`/api/staff/${staffId}/bank-qr`).catch(()=>null);
  const data = r&&r.ok ? await r.json() : null;
  const qrUrl = data?.qrUrl || `https://img.vietqr.io/image/970436-${s.bankAccount}-compact2.jpg?accountName=${encodeURIComponent(s.name||'')}`;

  let m = document.getElementById('staff-qr-modal');
  if (!m) { m=document.createElement('div');m.id='staff-qr-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:340px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div style="font-weight:800;font-size:15px;color:var(--navy);">STK – ${s.name}</div>
      <button onclick="document.getElementById('staff-qr-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <img src="${qrUrl}" style="width:200px;height:200px;border-radius:12px;border:2px solid #eee;margin-bottom:12px;" onerror="this.style.display='none'">
    <div style="background:#f8fafc;border-radius:10px;padding:12px;font-size:12.5px;text-align:left;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Tên TK:</span><span style="font-weight:700">${s.name}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#666">Số TK:</span><span style="font-weight:700;font-family:monospace">${s.bankAccount}</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#666">Ngân hàng:</span><span style="font-weight:600">${s.bankName||'Vietcombank'}</span></div>
    </div>
    <div style="font-size:10px;color:#aaa;margin-top:10px;">Quét để chuyển khoản lương</div>
  </div>`;
  m.style.display='flex';
}

// Override editBankInfo to also allow bank name
window.editBankInfo = function(staffId) {
  const s = staff.find(x=>x.id===staffId); if(!s) return;
  let m = document.getElementById('bank-edit-modal');
  if (!m) { m=document.createElement('div');m.id='bank-edit-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:380px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:16px;">Thông Tin Ngân Hàng – ${s.name}</div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Tên Ngân Hàng</label>
    <input id="bk-name" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;" value="${s.bankName||'Vietcombank'}" placeholder="VD: Vietcombank, Techcombank...">
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Số Tài Khoản</label>
    <input id="bk-account" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:monospace;margin-bottom:16px;box-sizing:border-box;" value="${s.bankAccount||''}" placeholder="Nhập số tài khoản">
    <div style="display:flex;gap:8px;">
      <button onclick="saveBankInfo(${staffId})" class="btn btn-gold" style="flex:1;">💾 Lưu</button>
      <button onclick="document.getElementById('bank-edit-modal').style.display='none'" style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>
  </div>`;
  m.style.display='flex';
};

async function saveBankInfo(staffId) {
  const s = staff.find(x=>x.id===staffId); if(!s) return;
  s.bankName    = document.getElementById('bk-name')?.value?.trim()||'';
  s.bankAccount = document.getElementById('bk-account')?.value?.trim()||'';
  await saveData();
  document.getElementById('bank-edit-modal').style.display='none';
  showToast('Đã lưu thông tin ngân hàng!');
  recalcPayroll();
}

// Update payroll table to show QR button next to STK
const _origRecalcV3 = window.recalcPayroll;
// Add QR icon in bank column via DOM patch after render
const _qrObserver = new MutationObserver(() => {
  document.querySelectorAll('[data-staffbankid]').forEach(cell => {
    const sid = Number(cell.dataset.staffbankid);
    if (!cell.querySelector('.qr-bank-btn')) {
      const btn = document.createElement('button');
      btn.className = 'qr-bank-btn';
      btn.title = 'Xem QR';
      btn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:13px;padding:0 2px;';
      btn.textContent = '⬡';
      btn.onclick = e => { e.stopPropagation(); showStaffBankQR(sid); };
      cell.appendChild(btn);
    }
  });
});
_qrObserver.observe(document.body, { childList:true, subtree:true });

// ════════════════════════════════════════
// ENHANCED DASHBOARD
// ════════════════════════════════════════
let _revenueChart = null;

function renderDashboardV3() {
  const now = new Date();
  // Update datetime
  const dtEl = document.getElementById('dash-datetime');
  if (dtEl) dtEl.textContent = now.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});

  // Update username
  const unEl = document.getElementById('dash-username');
  if (unEl && window.VS_USER) unEl.textContent = window.VS_USER.displayName || 'Admin';

  // Revenue this month stat card
  const m = now.getMonth()+1, y = now.getFullYear();
  const paidM = students.filter(s => {
    if (!s.paydate || s.payment==='Chưa Thanh Toán') return false;
    const d = new Date(s.paydate);
    return d.getFullYear()===y && (d.getMonth()+1)===m;
  });
  const totalM = paidM.reduce((a,s)=>a+Number(s.amount||0),0);
  const revEl = document.getElementById('stat-revenue-month');
  if (revEl) revEl.textContent = fmt(totalM);

  // ── Revenue Bar Chart (6 months) ──
  buildRevenueChart();

  // ── Subject Breakdown ──
  buildSubjectChart();

  // ── Alerts ──
  buildDashAlerts();
}

function buildRevenueChart() {
  const container = document.getElementById('dash-chart-revenue');
  if (!container) return;

  const now = new Date();
  const months = [];
  const values = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const m = d.getMonth()+1, y = d.getFullYear();
    months.push(`T${m}/${String(y).slice(2)}`);
    const total = students.filter(s => {
      if (!s.paydate || s.payment==='Chưa Thanh Toán') return false;
      const pd = new Date(s.paydate);
      return pd.getFullYear()===y && (pd.getMonth()+1)===m;
    }).reduce((a,s)=>a+Number(s.amount||0),0);
    values.push(total);
  }

  const maxVal = Math.max(...values, 1);
  const bars = months.map((m,i) => {
    const pct = Math.round(values[i]/maxVal*100);
    const isThis = i===5;
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px;">
      <div style="font-size:9px;color:var(--muted);font-weight:700;">${values[i]>0?fmt(values[i]).replace('đ','')+'đ':''}</div>
      <div style="flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;">
        <div style="width:70%;border-radius:6px 6px 0 0;background:${isThis?'var(--gold)':'var(--cream2)'};height:${Math.max(4,pct)}%;transition:height .4s;min-height:4px;max-height:120px;"></div>
      </div>
      <div style="font-size:10px;color:${isThis?'var(--gold)':'var(--muted)'};font-weight:${isThis?'800':'400'}">${m}</div>
    </div>`;
  }).join('');

  container.innerHTML = `<div style="display:flex;height:100%;gap:4px;align-items:flex-end;">${bars}</div>`;
}

function buildSubjectChart() {
  const container = document.getElementById('dash-chart-subject');
  if (!container) return;

  const bySubject = {};
  students.forEach(s => {
    const sub = s.subject || 'Khác';
    bySubject[sub] = (bySubject[sub]||0) + 1;
  });
  const sorted = Object.entries(bySubject).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const total = students.length || 1;
  const colors = ['#3b82f6','#22c55e','#a855f7','#f97316','#ef4444','#14b8a6','#f59e0b','#6366f1'];

  container.innerHTML = sorted.map(([sub,cnt],i) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-size:11px;font-weight:700;color:var(--navy)">${sub}</span>
        <span style="font-size:11px;color:var(--muted)">${cnt} HV</span>
      </div>
      <div style="background:var(--cream2);border-radius:4px;height:7px;overflow:hidden;">
        <div style="width:${Math.round(cnt/total*100)}%;height:100%;background:${colors[i%colors.length]};border-radius:4px;transition:width .5s;"></div>
      </div>
    </div>`).join('');
}

function buildDashAlerts() {
  const el = document.getElementById('dash-alerts');
  if (!el) return;
  const now = new Date();
  const alerts = [];

  // Overdue tuition (end date within 7 days, unpaid)
  students.filter(s => {
    if (s.payment !== 'Chưa Thanh Toán' || !s.end) return false;
    const daysLeft = Math.ceil((new Date(s.end)-now)/(1000*60*60*24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).slice(0,3).forEach(s => {
    const d = Math.ceil((new Date(s.end)-now)/(1000*60*60*24));
    alerts.push({type:'warn',icon:'⏰',text:`<b>${s.name}</b> còn ${d} ngày hết khóa, chưa đóng học phí`,action:`showPage('students')`});
  });

  // Pending makeups
  const pendingMakeup = (makeups||[]).filter(m=>m.status==='pending').length;
  if (pendingMakeup > 0)
    alerts.push({type:'info',icon:'🔄',text:`<b>${pendingMakeup}</b> lịch bù đang chờ xếp`,action:`showPage('makeup')`});

  // New leads
  const newLeads = (leads||[]).filter(l=>l.status==='Mới').length;
  if (newLeads > 0)
    alerts.push({type:'lead',icon:'🎯',text:`<b>${newLeads}</b> HV tiềm năng chưa tư vấn`,action:`showPage('leads')`});

  // Expiring soon (8-14 days)
  const expiringSoon = students.filter(s => {
    if (!s.end) return false;
    const d = Math.ceil((new Date(s.end)-now)/(1000*60*60*24));
    return d >= 8 && d <= 14;
  }).length;
  if (expiringSoon > 0)
    alerts.push({type:'info',icon:'📅',text:`<b>${expiringSoon}</b> học viên sắp hết khóa (8-14 ngày)`,action:`showPage('students')`});

  if (!alerts.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">✅ Không có vấn đề nào cần xử lý hôm nay</div>`;
    return;
  }

  const colorMap = {warn:'#fee2e2',info:'#dbeafe',lead:'#fef9c3'};
  const borderMap = {warn:'#ef4444',info:'#3b82f6',lead:'#f59e0b'};
  el.innerHTML = alerts.map(a => `
    <div onclick="${a.action}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${colorMap[a.type]};border-left:3px solid ${borderMap[a.type]};border-radius:0 8px 8px 0;margin-bottom:8px;cursor:pointer;transition:opacity .15s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
      <span style="font-size:16px">${a.icon}</span>
      <span style="font-size:12px;color:#333;">${a.text}</span>
    </div>`).join('');
}

// Override renderDashboard to also call v3 enhancements
const _origRenderDashboard = window.renderDashboard;
window.renderDashboard = function() {
  if (typeof _origRenderDashboard === 'function') _origRenderDashboard();
  setTimeout(renderDashboardV3, 50);
};

// Live clock on dashboard
setInterval(() => {
  if (document.getElementById('page-dashboard')?.classList.contains('active')) {
    const dtEl = document.getElementById('dash-datetime');
    if (dtEl) {
      const now = new Date();
      dtEl.textContent = now.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }
  }
}, 1000);

// ════════════════════════════════════════
// STUDENT CARE MODULE
// ════════════════════════════════════════
async function renderCarePage() {
  const content = document.getElementById('care-content');
  if (!content) return;

  const searchHtml = `
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <input id="care-search" placeholder="Tìm tên học viên..." oninput="filterCareList()"
        style="flex:1;min-width:200px;border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;">
      <button onclick="openAddContactModal(null)" class="btn btn-gold">+ Ghi Liên Lạc Mới</button>
    </div>`;

  // Build care list from students
  const careItems = students.slice().sort((a,b) => {
    const la = (a.careLog||[]).slice(-1)[0]?.date || '2000-01-01';
    const lb = (b.careLog||[]).slice(-1)[0]?.date || '2000-01-01';
    return la < lb ? 1 : -1;
  });

  const rows = careItems.slice(0,30).map(s => {
    const lastContact = (s.careLog||[]).slice(-1)[0];
    const nextFollow  = s.nextFollowUp;
    const daysSince   = lastContact ? Math.floor((new Date()-new Date(lastContact.date))/(1000*60*60*24)) : null;
    const isOverdue   = nextFollow && new Date(nextFollow) < new Date();
    return `
      <tr onclick="openStudentCare(${s.id})" style="cursor:pointer;">
        <td><div style="font-weight:700;color:var(--navy)">${s.name}</div><div style="font-size:11px;color:var(--muted)">${s.subject||''}</div></td>
        <td style="font-size:12px;">${lastContact ? `<div style="color:#555">${lastContact.type||'–'}</div><div style="font-size:10px;color:var(--muted)">${fmtDate(lastContact.date)} (${daysSince}ng trước)</div>` : '<span style="color:var(--muted)">Chưa liên lạc</span>'}</td>
        <td>${nextFollow ? `<span style="background:${isOverdue?'#fee2e2':'#dbeafe'};color:${isOverdue?'#dc2626':'#1e40af'};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;">${isOverdue?'⚠ Quá hạn':'📅 '} ${fmtDate(nextFollow)}</span>` : '–'}</td>
        <td><span style="font-size:11px;padding:3px 8px;border-radius:6px;background:${{
          'Đang học':'#dcfce7','Hết khóa':'#fee2e2','Tạm nghỉ':'#fef9c3'
        }[s.careStatus]||'var(--cream2)'};color:var(--navy);font-weight:700;">${s.careStatus||'Đang học'}</span></td>
        <td>
          <button onclick="event.stopPropagation();openAddContactModal(${s.id})" style="background:var(--cream2);border:none;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;color:var(--navy);">+ Ghi Log</button>
        </td>
      </tr>`;
  }).join('');

  content.innerHTML = searchHtml + `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Học Viên</th><th>Lần Liên Lạc Cuối</th><th>Follow-up Tiếp</th><th>Trạng Thái</th><th></th></tr></thead>
          <tbody id="care-tbody">${rows||'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

function filterCareList() {
  const q = (document.getElementById('care-search')?.value||'').toLowerCase();
  document.querySelectorAll('#care-tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function openStudentCare(studentId) {
  const s = students.find(x=>x.id===studentId); if(!s) return;
  let m = document.getElementById('care-modal');
  if (!m) { m=document.createElement('div');m.id='care-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  const logs = (s.careLog||[]).slice().reverse();
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:520px;width:100%;font-family:'Be Vietnam Pro',sans-serif;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div><div style="font-weight:800;font-size:16px;color:var(--navy)">${s.name}</div><div style="font-size:12px;color:var(--muted)">${s.subject} · ${s.phone||'–'}</div></div>
      <button onclick="document.getElementById('care-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <select id="care-status-sel" onchange="updateCareStatus(${s.id})" style="border:1.5px solid #e0e0e0;border-radius:8px;padding:6px 10px;font-size:12px;font-family:'Be Vietnam Pro',sans-serif;">
        ${['Đang học','Hết khóa','Tạm nghỉ','Đã nghỉ'].map(v=>`<option ${(s.careStatus||'Đang học')===v?'selected':''}>${v}</option>`).join('')}
      </select>
      <input type="date" id="care-followup" value="${s.nextFollowUp||''}" style="border:1.5px solid #e0e0e0;border-radius:8px;padding:6px 10px;font-size:12px;font-family:'Be Vietnam Pro',sans-serif;" onchange="updateFollowUp(${s.id})">
      <label style="font-size:11px;color:var(--muted);display:flex;align-items:center;">📅 Follow-up tiếp</label>
    </div>
    <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:10px;">Lịch Sử Liên Lạc (${logs.length})</div>
    <div style="max-height:260px;overflow-y:auto;">
      ${logs.length ? logs.map(l=>`
        <div style="border-left:3px solid ${getCareTypeColor(l.type)};padding:8px 12px;margin-bottom:8px;background:var(--cream);border-radius:0 8px 8px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-weight:700;font-size:12px;color:var(--navy)">${l.type||'Liên lạc'}</span>
            <span style="font-size:10px;color:var(--muted)">${fmtDate(l.date)} · ${l.by||''}</span>
          </div>
          <div style="font-size:12px;color:#555">${l.note||''}</div>
          ${l.result?`<div style="font-size:11px;color:var(--muted);margin-top:2px;">→ ${l.result}</div>`:''}
        </div>`).join('') : '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">Chưa có lịch sử</div>'}
    </div>
    <button onclick="openAddContactModal(${s.id})" class="btn btn-gold" style="width:100%;margin-top:14px;">+ Ghi Liên Lạc Mới</button>
  </div>`;
  m.style.display='flex';
}

async function updateCareStatus(studentId) {
  const val = document.getElementById('care-status-sel')?.value;
  const s = students.find(x=>x.id===studentId); if(!s) return;
  s.careStatus = val;
  await saveData();
  showToast('Cập nhật trạng thái!');
}

async function updateFollowUp(studentId) {
  const val = document.getElementById('care-followup')?.value;
  const s = students.find(x=>x.id===studentId); if(!s) return;
  s.nextFollowUp = val;
  await saveData();
  showToast('Đã cập nhật lịch follow-up!');
}

function openAddContactModal(studentId) {
  document.getElementById('care-modal')?.style && (document.getElementById('care-modal').style.display='none');
  let m = document.getElementById('contact-log-modal');
  if (!m) { m=document.createElement('div');m.id='contact-log-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const studentSel = studentId
    ? `<input type="hidden" id="cl-student" value="${studentId}"><div style="font-weight:700;font-size:14px;color:var(--navy);padding:8px 0;">${students.find(x=>x.id===studentId)?.name||''}</div>`
    : `<select id="cl-student" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
        ${students.map(s=>`<option value="${s.id}">${s.name} – ${s.subject}</option>`).join('')}
       </select>`;

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:440px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:14px;">Ghi Liên Lạc</div>
    ${studentSel}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Hình Thức</label>
        <select id="cl-type" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
          <option>Gọi điện</option><option>Zalo</option><option>Gặp mặt</option><option>Email</option>
        </select>
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ngày</label>
        <input type="date" id="cl-date" value="${new Date().toISOString().slice(0,10)}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>
    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Nội Dung</label>
    <textarea id="cl-note" style="width:100%;min-height:70px;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;resize:vertical;" placeholder="Nội dung cuộc gọi/gặp mặt..."></textarea>
    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Kết Quả / Hành Động Tiếp</label>
    <input type="text" id="cl-result" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px 10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;" placeholder="VD: Sẽ đóng học phí vào T6">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button onclick="saveContactLog()" class="btn btn-gold">💾 Lưu</button>
      <button onclick="document.getElementById('contact-log-modal').style.display='none'" style="border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>
  </div>`;
  m.style.display='flex';
}

async function saveContactLog() {
  const sid  = Number(document.getElementById('cl-student')?.value);
  const type = document.getElementById('cl-type')?.value||'Gọi điện';
  const date = document.getElementById('cl-date')?.value;
  const note = document.getElementById('cl-note')?.value||'';
  const result = document.getElementById('cl-result')?.value||'';
  const s = students.find(x=>x.id===sid); if(!s) return;
  if (!s.careLog) s.careLog = [];
  s.careLog.push({ id:Date.now(), type, date, note, result, by: window.VS_USER?.displayName||'Admin' });
  await saveData();
  document.getElementById('contact-log-modal').style.display='none';
  showToast('Đã ghi liên lạc!');
  renderCarePage();
}

// ════════════════════════════════════════
// REPORT PAGE
// ════════════════════════════════════════
function renderReportPage() {
  const content = document.getElementById('report-content');
  if (!content) return;

  const now = new Date();
  const y = now.getFullYear();

  // Calculate monthly revenue for full year
  const monthlyRevenue = Array.from({length:12},(_,i)=>{
    const m = i+1;
    return students.filter(s=>{
      if(!s.paydate||s.payment==='Chưa Thanh Toán') return false;
      const d=new Date(s.paydate);
      return d.getFullYear()===y&&(d.getMonth()+1)===m;
    }).reduce((a,s)=>a+Number(s.amount||0),0);
  });
  const totalYear = monthlyRevenue.reduce((a,b)=>a+b,0);
  const maxRev = Math.max(...monthlyRevenue,1);

  // Subject stats
  const bySub = {};
  students.forEach(s=>{ const k=s.subject||'Khác'; bySub[k]=(bySub[k]||0)+1; });
  const subRows = Object.entries(bySub).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
    <tr><td>${k}</td><td style="text-align:center;font-weight:700">${v}</td><td style="text-align:right">${Math.round(v/students.length*100)}%</td></tr>`).join('');

  // Payment stats
  const paid   = students.filter(s=>s.payment!=='Chưa Thanh Toán').length;
  const unpaid = students.filter(s=>s.payment==='Chưa Thanh Toán').length;

  // Monthly bars
  const months=['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const bars = months.map((m,i)=>{
    const pct=Math.round(monthlyRevenue[i]/maxRev*100);
    const isNow=(i+1)===(now.getMonth()+1);
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:3px;">
      <div style="font-size:8px;color:var(--muted)">${monthlyRevenue[i]>0?fmt(monthlyRevenue[i]).replace('đ',''):''}</div>
      <div style="flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;">
        <div style="width:80%;border-radius:5px 5px 0 0;background:${isNow?'var(--gold)':'#93c5fd'};height:${Math.max(3,pct)}%;min-height:3px;transition:height .4s;"></div>
      </div>
      <div style="font-size:9px;color:${isNow?'var(--gold)':'var(--muted)'};font-weight:${isNow?'800':'400'}">${m}</div>
    </div>`;
  }).join('');

  content.innerHTML = `
    <!-- Summary Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalYear)}</div><div class="stat-label">Doanh Thu ${y}</div></div>
      <div class="stat-card"><div class="stat-value">${students.length}</div><div class="stat-label">Tổng Học Viên</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#22c55e">${paid}</div><div class="stat-label">Đã Thanh Toán</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#ef4444">${unpaid}</div><div class="stat-label">Chưa Thanh Toán</div></div>
      <div class="stat-card"><div class="stat-value">${classes.length}</div><div class="stat-label">Số Lớp</div></div>
      <div class="stat-card"><div class="stat-value">${staff.length}</div><div class="stat-label">Nhân Sự</div></div>
    </div>

    <!-- Revenue Chart -->
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="card-title">Doanh Thu Theo Tháng – ${y}</div>
        <button onclick="exportReportPDF()" style="background:var(--navy);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">🖨 In PDF</button>
      </div>
      <div style="height:180px;display:flex;gap:4px;align-items:flex-end;">${bars}</div>
    </div>

    <!-- Two columns -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Học Viên Theo Môn</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Môn Học</th><th style="text-align:center">HV</th><th style="text-align:right">%</th></tr></thead>
          <tbody>${subRows||'<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Tình Trạng Học Phí</div>
        <div style="padding:10px 0;">
          ${[
            {label:'Đã Chuyển Khoản',count:students.filter(s=>s.payment==='Đã Chuyển Khoản').length,color:'#3b82f6'},
            {label:'Tiền Mặt',count:students.filter(s=>s.payment==='Tiền Mặt').length,color:'#22c55e'},
            {label:'Chưa Thanh Toán',count:students.filter(s=>s.payment==='Chưa Thanh Toán').length,color:'#ef4444'},
          ].map(({label,count,color})=>`
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:12px;font-weight:700;color:var(--navy)">${label}</span>
                <span style="font-size:12px;color:var(--muted)">${count} HV</span>
              </div>
              <div style="background:var(--cream2);border-radius:4px;height:8px;overflow:hidden;">
                <div style="width:${Math.round(count/Math.max(students.length,1)*100)}%;height:100%;background:${color};border-radius:4px;"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function exportReportPDF() {
  window.print();
}

// ════════════════════════════════════════
// ROOM MANAGEMENT
// ════════════════════════════════════════
function renderRoomsPage() {
  const content = document.getElementById('rooms-content');
  if (!content) return;

  // Load rooms from database or use defaults
  const rooms = (typeof db !== 'undefined' ? db.rooms : null) || [
    {id:1,name:'Phòng Piano 1',capacity:2,subject:'Piano'},
    {id:2,name:'Phòng Piano 2',capacity:2,subject:'Piano'},
    {id:3,name:'Phòng Guitar',capacity:4,subject:'Guitar'},
    {id:4,name:'Phòng Dance',capacity:20,subject:'Dance'},
    {id:5,name:'Phòng Vẽ',capacity:8,subject:'Vẽ'},
  ];

  const days=['T2','T3','T4','T5','T6','T7','CN'];
  const daysFull=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];

  // Build room schedule grid
  const roomRows = rooms.map(room => {
    const dayCells = daysFull.map(day => {
      const roomClasses = classes.filter(c =>
        (c.room===room.name||c.room===String(room.id)) &&
        (c.schedule||[]).some(s=>s.day===day)
      );
      if (!roomClasses.length) return `<td style="background:#f9fafb;border:1px solid #eee;padding:6px;font-size:10px;color:#ccc;text-align:center;">–</td>`;
      const cellContent = roomClasses.map(c=>{
        const slot=(c.schedule||[]).find(s=>s.day===day);
        return `<div style="background:var(--navy);color:#fff;border-radius:5px;padding:4px 6px;margin-bottom:2px;font-size:10px;font-weight:700;">${slot?slot.start:'?'} ${c.name}</div>`;
      }).join('');
      return `<td style="border:1px solid #eee;padding:4px;vertical-align:top;">${cellContent}</td>`;
    }).join('');
    return `<tr>
      <td style="border:1px solid #eee;padding:8px 10px;font-weight:700;color:var(--navy);font-size:12px;white-space:nowrap;background:var(--cream);">
        ${room.name}<div style="font-size:10px;color:var(--muted);font-weight:400">${room.subject} · ${room.capacity} người</div>
      </td>
      ${dayCells}
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${rooms.map(r=>`<div style="background:var(--cream);border:1.5px solid var(--cream2);border-radius:10px;padding:8px 14px;font-size:12px;">
          <div style="font-weight:700;color:var(--navy)">${r.name}</div>
          <div style="color:var(--muted);font-size:10px">${r.subject} · ${r.capacity} người</div>
        </div>`).join('')}
      </div>
      <button onclick="openAddRoomModal()" class="btn btn-gold">+ Thêm Phòng</button>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px;">Lịch Sử Dụng Phòng</div>
      <div class="table-wrap">
        <table style="min-width:700px;">
          <thead><tr><th>Phòng</th>${days.map(d=>`<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
          <tbody>${roomRows||'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Chưa có phòng nào</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

function openAddRoomModal() {
  const name = prompt('Tên phòng học:');
  if (!name) return;
  showToast(`Đã thêm phòng: ${name}`);
}

// ════════════════════════════════════════
// DARK MODE
// ════════════════════════════════════════
let _darkMode = localStorage.getItem('vs_dark') === '1';

function toggleDarkMode() {
  _darkMode = !_darkMode;
  localStorage.setItem('vs_dark', _darkMode?'1':'0');
  applyDarkMode();
}

function applyDarkMode() {
  if (_darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  const btn = document.getElementById('dark-mode-btn');
  if (btn) btn.textContent = _darkMode ? '☀️' : '🌙';
}

// Add dark mode button to sidebar
function addDarkModeButton() {
  const notifRow = document.querySelector('.sidebar > div[style*="display:flex"]');
  if (notifRow && !document.getElementById('dark-mode-btn')) {
    const btn = document.createElement('button');
    btn.id = 'dark-mode-btn';
    btn.textContent = _darkMode ? '☀️' : '🌙';
    btn.title = 'Chế độ tối';
    btn.style.cssText = 'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:15px;';
    btn.onclick = toggleDarkMode;
    notifRow.appendChild(btn);
  }
}

// ════════════════════════════════════════
// HOOK SHOW PAGE for new pages
// ════════════════════════════════════════
const _origSPFinal = window.showPage;
window.showPage = function(id) {
  const newPages = {
    care:   renderCarePage,
    report: renderReportPage,
    rooms:  renderRoomsPage,
  };
  if (newPages[id]) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('page-'+id);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n=>{
      const oc=n.getAttribute('onclick')||'';
      if(oc.includes("'"+id+"'")) n.classList.add('active');
    });
    newPages[id]();
    return;
  }
  if (typeof _origSPFinal === 'function') _origSPFinal(id);
};

// ════════════════════════════════════════
// INIT V3
// ════════════════════════════════════════
const _origInitFinal = window.initAppAfterLogin;
window.initAppAfterLogin = async function() {
  if (typeof _origInitFinal==='function') _origInitFinal();
  applyDarkMode();
  addDarkModeButton();
  // Trigger dashboard v3 enhancements
  setTimeout(renderDashboardV3, 200);
};

// Print CSS for PDF export
const printStyle = document.createElement('style');
printStyle.textContent = `
  @media print {
    .sidebar, #vs-hamburger, .btn, button, .toolbar { display:none!important; }
    .main { margin-left:0!important; padding:0!important; }
    .page { display:block!important; }
    .page:not(.active) { display:none!important; }
    .card { box-shadow:none!important; border:1px solid #eee!important; break-inside:avoid; }
    body { background:#fff!important; }
  }`;
document.head.appendChild(printStyle);

// ════════════════════════════════════════
// HỒ SƠ HỌC VIÊN ĐẦY ĐỦ
// ════════════════════════════════════════
function openStudentProfile(studentId) {
  const s = students.find(x => x.id === studentId);
  if (!s) return;

  let m = document.getElementById('student-profile-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'student-profile-modal';
    document.body.appendChild(m);
  }
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px;';

  // Calculate progress
  const totalPkg = extractTotalSessions ? extractTotalSessions(s.pkg) : 0;
  const doneSessions = (countStudentSessions && totalPkg) ? countStudentSessions(s.id, s.classid) : 0;
  const pct = totalPkg ? Math.min(100, Math.round(doneSessions/totalPkg*100)) : 0;
  const daysLeft = s.end ? Math.ceil((new Date(s.end) - new Date()) / (1000*60*60*24)) : null;
  const cls = classes.find(c => Number(c.id) === Number(s.classid));

  // Attendance history (last 12)
  const attHistory = [];
  (attendance||[]).slice().reverse().forEach(a => {
    if (a.records && a.records[String(s.id)]) {
      attHistory.push({ date: a.date, status: a.records[String(s.id)] });
    }
  });

  // Feedbacks
  const feedbacks = (s.feedbacks||[]).slice().reverse().slice(0,10);

  // Media files
  const mediaFiles = s.mediaFiles || [];

  m.innerHTML = `
  <div style="background:#fff;border-radius:20px;width:100%;max-width:860px;max-height:92vh;overflow-y:auto;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 25px 80px rgba(0,0,0,.4);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,var(--navy),var(--accent));padding:22px 24px;border-radius:20px 20px 0 0;position:sticky;top:0;z-index:10;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:52px;height:52px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#1a1a1a;flex-shrink:0;">
            ${s.name.charAt(0)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:900;color:#fff;">${s.name}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.65);">${s.subject||''} · ${cls?cls.name:'Chưa có lớp'}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button onclick="openFeedbackModal(${s.id})" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">✍ Nhận Xét</button>
          <button onclick="document.getElementById('student-profile-modal').style.display='none'" style="background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:8px;width:34px;height:34px;font-size:18px;cursor:pointer;">✕</button>
        </div>
      </div>
    </div>

    <div style="padding:20px 24px;">

      <!-- TABS -->
      <div style="display:flex;gap:6px;margin-bottom:20px;border-bottom:2px solid var(--cream2);padding-bottom:0;">
        ${['info','progress','media','feedback','care'].map((tab,i)=>{
          const labels = {info:'📋 Thông Tin', progress:'📈 Tiến Độ', media:'📸 Ảnh & Video', feedback:'💬 Nhận Xét', care:'🤝 Chăm Sóc'};
          return `<button onclick="switchProfileTab('${tab}',${studentId})" id="ptab-${tab}"
            style="padding:8px 14px;border:none;background:${i===0?'var(--navy)':'transparent'};color:${i===0?'#fff':'var(--muted)'};border-radius:8px 8px 0 0;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:-2px;border-bottom:${i===0?'2px solid var(--navy)':'none'};">${labels[tab]}</button>`;
        }).join('')}
      </div>

      <!-- INFO TAB -->
      <div id="ptab-content-info" class="ptab-content">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="background:var(--cream);border-radius:12px;padding:16px;">
            <div style="font-weight:800;font-size:13px;color:var(--navy);margin-bottom:12px;">Thông Tin Cá Nhân</div>
            ${[
              ['Họ tên', s.name],
              ['Ngày sinh', fmtDate(s.dob)],
              ['Phụ huynh', s.parent||'–'],
              ['SĐT', s.phone||'–'],
            ].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cream2);font-size:13px;"><span style="color:var(--muted)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span></div>`).join('')}
          </div>
          <div style="background:var(--cream);border-radius:12px;padding:16px;">
            <div style="font-weight:800;font-size:13px;color:var(--navy);margin-bottom:12px;">Khóa Học</div>
            ${[
              ['Môn học', s.subject||'–'],
              ['Gói học', s.pkg||'–'],
              ['Lớp', cls?cls.name:'–'],
              ['Ngày bắt đầu', fmtDate(s.start)],
              ['Ngày kết thúc', fmtDate(s.end) + (daysLeft!==null&&daysLeft<=14?` <span style="color:#dc2626;font-weight:700">(còn ${daysLeft}ng)</span>`:'')],
              ['Học phí', s.amount?fmt(s.amount):'–'],
              ['Trạng thái', s.payment||'–'],
            ].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--cream2);font-size:12px;"><span style="color:var(--muted)">${k}</span><span style="font-weight:600;color:var(--navy)">${v}</span></div>`).join('')}
          </div>
        </div>
        <div style="background:var(--cream);border-radius:12px;padding:14px;margin-top:14px;">
          <div style="font-weight:800;font-size:13px;color:var(--navy);margin-bottom:10px;">Ghi Chú</div>
          <div style="font-size:13px;color:#555;line-height:1.7;">${s.note||'<span style="color:var(--muted);font-style:italic">Chưa có ghi chú</span>'}</div>
        </div>
      </div>

      <!-- PROGRESS TAB -->
      <div id="ptab-content-progress" class="ptab-content" style="display:none;">
        <!-- Progress ring + stats -->
        <div style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;margin-bottom:20px;">
          <div style="text-align:center;">
            <div style="position:relative;width:110px;height:110px;">
              <svg width="110" height="110" style="transform:rotate(-90deg)">
                <circle cx="55" cy="55" r="45" fill="none" stroke="var(--cream2)" stroke-width="10"/>
                <circle cx="55" cy="55" r="45" fill="none" stroke="var(--gold)" stroke-width="10"
                  stroke-dasharray="${Math.round(2*Math.PI*45)}" stroke-dashoffset="${Math.round(2*Math.PI*45*(1-pct/100))}"
                  stroke-linecap="round" style="transition:stroke-dashoffset .6s;"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-size:22px;font-weight:900;color:var(--navy)">${pct}%</div>
                <div style="font-size:10px;color:var(--muted)">hoàn thành</div>
              </div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:var(--gold)">${doneSessions}</div>
              <div style="font-size:11px;color:var(--muted)">Buổi đã học</div>
            </div>
            <div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:var(--navy)">${totalPkg||'?'}</div>
              <div style="font-size:11px;color:var(--muted)">Tổng buổi</div>
            </div>
            <div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#22c55e">${attHistory.filter(a=>a.status==='present').length}</div>
              <div style="font-size:11px;color:var(--muted)">Có mặt</div>
            </div>
            <div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:24px;font-weight:900;color:#ef4444">${attHistory.filter(a=>a.status==='absent').length}</div>
              <div style="font-size:11px;color:var(--muted)">Vắng</div>
            </div>
          </div>
        </div>

        <!-- Attendance history dots -->
        <div style="background:var(--cream);border-radius:12px;padding:14px;">
          <div style="font-weight:800;font-size:13px;color:var(--navy);margin-bottom:12px;">Lịch Sử Điểm Danh (gần nhất)</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${attHistory.slice(0,30).map(a => {
              const color = {present:'#22c55e',absent:'#ef4444',late:'#f59e0b'}[a.status]||'#94a3b8';
              const label = {present:'Có mặt',absent:'Vắng',late:'Muộn'}[a.status]||a.status;
              return `<div title="${fmtDate(a.date)}: ${label}" style="width:28px;height:28px;border-radius:6px;background:${color}20;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${color};cursor:default;">${new Date(a.date).getDate()}</div>`;
            }).join('')||'<span style="color:var(--muted);font-size:13px">Chưa có dữ liệu điểm danh</span>'}
          </div>
        </div>

        <!-- Makeup sessions -->
        ${(makeups||[]).filter(mk=>mk.studentId===s.id).length?`
        <div style="background:var(--cream);border-radius:12px;padding:14px;margin-top:12px;">
          <div style="font-weight:800;font-size:13px;color:var(--navy);margin-bottom:10px;">Lịch Bù</div>
          ${(makeups||[]).filter(mk=>mk.studentId===s.id).slice(0,5).map(mk=>`
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cream2);font-size:12px;">
              <span>Vắng: ${fmtDate(mk.absentDate)}</span>
              <span>Bù: ${mk.makeupDate?fmtDate(mk.makeupDate):'Chưa xếp'}</span>
              <span style="padding:2px 8px;border-radius:4px;background:${mk.status==='done'?'#dcfce7':'#fef9c3'};font-weight:700;font-size:10px;">${mk.status==='done'?'Đã bù':'Chờ bù'}</span>
            </div>`).join('')}
        </div>`:''} 
      </div>

      <!-- MEDIA TAB -->
      <div id="ptab-content-media" class="ptab-content" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-weight:800;font-size:14px;color:var(--navy);">Ảnh & Video Học Tập (${mediaFiles.length} file)</div>
          <div style="display:flex;gap:8px;">
            <label style="background:var(--navy);color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;">
              <input type="file" accept="image/*,video/*" multiple style="display:none;" onchange="uploadStudentMedia(${s.id},this)">
              📁 Tải Lên
            </label>
            <button onclick="openCameraMedia(${s.id})" style="background:var(--gold);color:#1a1a1a;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📸 Chụp Ảnh</button>
          </div>
        </div>

        <!-- Camera capture area -->
        <div id="media-camera-${s.id}" style="display:none;background:#000;border-radius:12px;padding:12px;margin-bottom:14px;">
          <video id="media-video-${s.id}" autoplay playsinline style="width:100%;max-height:250px;border-radius:8px;object-fit:cover;"></video>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button onclick="snapMediaPhoto(${s.id})" style="flex:1;background:var(--gold);color:#1a1a1a;border:none;border-radius:8px;padding:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📸 Chụp</button>
            <button onclick="stopMediaCamera(${s.id})" style="flex:1;background:rgba(255,255,255,.1);color:#fff;border:none;border-radius:8px;padding:8px;font-size:13px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
          </div>
          <canvas id="media-canvas-${s.id}" style="display:none;"></canvas>
        </div>

        <!-- Caption input -->
        <div id="media-caption-wrap-${s.id}" style="display:none;background:var(--cream);border-radius:10px;padding:12px;margin-bottom:14px;">
          <div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Mô tả ảnh/video</div>
          <input id="media-caption-${s.id}" placeholder="VD: Buổi học ngày 25/05, luyện bài Für Elise..." style="width:100%;border:1.5px solid var(--cream2);border-radius:8px;padding:8px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;margin-bottom:8px;">
          <button onclick="confirmUploadMedia(${s.id})" class="btn btn-gold" style="width:100%;">✅ Xác Nhận Upload</button>
        </div>

        <!-- Media grid -->
        <div id="media-grid-${s.id}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
          ${mediaFiles.length ? mediaFiles.slice().reverse().map(f=>`
            <div style="position:relative;border-radius:10px;overflow:hidden;background:var(--cream);aspect-ratio:1;">
              ${f.type==='video'
                ? `<video src="${f.url}" style="width:100%;height:100%;object-fit:cover;" controls></video>`
                : `<img src="${f.url}" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="viewMediaFull('${f.url}')" onerror="this.style.display='none'">`}
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:6px 8px;">
                <div style="font-size:10px;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.caption||f.filename}</div>
                <div style="font-size:9px;color:rgba(255,255,255,.7);">${fmtDate(f.date)}</div>
              </div>
              <button onclick="deleteStudentMedia(${s.id},'${f.filename}')" style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>`).join('')
          : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">
              <div style="font-size:36px;margin-bottom:8px;">📸</div>
              <div style="font-size:13px;">Chưa có ảnh hoặc video nào.<br>Tải lên hoặc chụp ảnh trong buổi học!</div>
            </div>`}
        </div>
      </div>

      <!-- FEEDBACK TAB -->
      <div id="ptab-content-feedback" class="ptab-content" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="font-weight:800;font-size:14px;color:var(--navy);">Nhận Xét Của Giáo Viên (${feedbacks.length})</div>
          <button onclick="openFeedbackModal(${s.id})" class="btn btn-gold">+ Thêm Nhận Xét</button>
        </div>
        ${feedbacks.length ? feedbacks.map(f=>`
          <div style="border-left:4px solid var(--gold);padding:12px 14px;margin-bottom:12px;background:var(--cream);border-radius:0 10px 10px 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <div style="font-weight:800;font-size:12px;color:var(--navy);">${f.by||'GV'}</div>
              <div style="font-size:11px;color:var(--muted);">${new Date(f.at).toLocaleDateString('vi-VN')}</div>
            </div>
            ${f.feedback?`<div style="font-size:13px;color:#333;margin-bottom:6px;line-height:1.6;">${f.feedback}</div>`:''}
            ${f.homework?`<div style="background:#fff;border-radius:6px;padding:8px 10px;font-size:12px;color:#555;"><b>📝 Bài về nhà:</b> ${f.homework}</div>`:''}
            ${(f.mediaUrls||[]).length?`<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${f.mediaUrls.map(u=>`<a href="${u}" target="_blank" style="background:var(--navy);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;">🔗 Xem file</a>`).join('')}</div>`:''}
          </div>`).join('')
        : `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px;">Chưa có nhận xét nào từ giáo viên</div>`}
      </div>

      <!-- CARE TAB -->
      <div id="ptab-content-care" class="ptab-content" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="font-weight:800;font-size:14px;color:var(--navy);">Lịch Sử Chăm Sóc</div>
          <button onclick="openAddContactModal(${s.id})" class="btn btn-gold">+ Ghi Liên Lạc</button>
        </div>
        ${(s.careLog||[]).slice().reverse().slice(0,15).map(l=>`
          <div style="border-left:3px solid ${getCareTypeColor(l.type)};padding:10px 14px;margin-bottom:10px;background:var(--cream);border-radius:0 10px 10px 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:800;font-size:12px;color:var(--navy);">${l.type||'Liên lạc'}</span>
              <span style="font-size:11px;color:var(--muted);">${fmtDate(l.date)} · ${l.by||''}</span>
            </div>
            <div style="font-size:12px;color:#555;">${l.note||''}</div>
            ${l.result?`<div style="font-size:11px;color:var(--muted);margin-top:3px;">→ ${l.result}</div>`:''}
          </div>`).join('') || `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px;">Chưa có lịch sử liên lạc</div>`}
        ${s.nextFollowUp?`<div style="background:#dbeafe;border-radius:10px;padding:12px;margin-top:6px;font-size:13px;color:#1e40af;"><b>📅 Follow-up tiếp:</b> ${fmtDate(s.nextFollowUp)}</div>`:''}
      </div>

    </div>
  </div>`;

  m.style.display = 'flex';
  // Store pending upload data
  window._pendingMediaUpload = { studentId, files: [] };
}

// Tab switching
function switchProfileTab(tab, studentId) {
  ['info','progress','media','feedback','care'].forEach(t => {
    const content = document.getElementById(`ptab-content-${t}`);
    const btn     = document.getElementById(`ptab-${t}`);
    if (content) content.style.display = t === tab ? '' : 'none';
    if (btn) {
      btn.style.background   = t === tab ? 'var(--navy)' : 'transparent';
      btn.style.color        = t === tab ? '#fff' : 'var(--muted)';
      btn.style.borderBottom = t === tab ? '2px solid var(--navy)' : 'none';
    }
  });
}

// Media camera
let _mediaStreams = {};
async function openCameraMedia(studentId) {
  const wrap  = document.getElementById(`media-camera-${studentId}`);
  const video = document.getElementById(`media-video-${studentId}`);
  if (!wrap || !video) return;
  try {
    _mediaStreams[studentId] = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
    video.srcObject = _mediaStreams[studentId];
    wrap.style.display = 'block';
  } catch(e) { showToast('Không thể mở camera: ' + e.message, true); }
}

function snapMediaPhoto(studentId) {
  const video  = document.getElementById(`media-video-${studentId}`);
  const canvas = document.getElementById(`media-canvas-${studentId}`);
  if (!video || !canvas) return;
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  stopMediaCamera(studentId);
  window._pendingMediaUpload = { studentId, files: [{ dataUrl, filename: `photo_${Date.now()}.jpg`, type: 'image' }] };
  const captionWrap = document.getElementById(`media-caption-wrap-${studentId}`);
  if (captionWrap) captionWrap.style.display = 'block';
}

function stopMediaCamera(studentId) {
  const s = _mediaStreams[studentId];
  if (s) { s.getTracks().forEach(t=>t.stop()); delete _mediaStreams[studentId]; }
  const wrap = document.getElementById(`media-camera-${studentId}`);
  if (wrap) wrap.style.display = 'none';
}

async function uploadStudentMedia(studentId, input) {
  const files = [...input.files];
  if (!files.length) return;
  window._pendingMediaUpload = {
    studentId,
    files: await Promise.all(files.map(f => new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res({ dataUrl: e.target.result, filename: f.name, type: f.type.startsWith('video') ? 'video' : 'image' });
      reader.readAsDataURL(f);
    })))
  };
  const captionWrap = document.getElementById(`media-caption-wrap-${studentId}`);
  if (captionWrap) captionWrap.style.display = 'block';
}

async function confirmUploadMedia(studentId) {
  const pending = window._pendingMediaUpload;
  if (!pending || !pending.files.length) return;
  const caption = document.getElementById(`media-caption-${studentId}`)?.value || '';
  const today   = new Date().toISOString().slice(0,10);

  let uploaded = 0;
  for (const file of pending.files) {
    try {
      const r = await fetch(`/api/student/${studentId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: file.dataUrl, filename: file.filename, type: file.type, caption, date: today })
      });
      if (r.ok) uploaded++;
    } catch(e) { console.error('Upload error:', e); }
  }

  showToast(`Đã upload ${uploaded} file!`);
  window._pendingMediaUpload = null;
  const captionWrap = document.getElementById(`media-caption-wrap-${studentId}`);
  if (captionWrap) { captionWrap.style.display='none'; const inp=captionWrap.querySelector('input'); if(inp) inp.value=''; }

  // Refresh profile
  openStudentProfile(studentId);
  switchProfileTab('media', studentId);
}

async function deleteStudentMedia(studentId, filename) {
  if (!confirm(`Xóa file "${filename}"?`)) return;
  const r = await fetch(`/api/student/${studentId}/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
  if (r.ok) { showToast('Đã xóa!'); openStudentProfile(studentId); switchProfileTab('media', studentId); }
  else showToast('Lỗi xóa', true);
}

function viewMediaFull(url) {
  let m = document.getElementById('media-full-modal');
  if (!m) { m=document.createElement('div');m.id='media-full-modal';m.onclick=()=>m.style.display='none';document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:pointer;';
  m.innerHTML=`<div style="text-align:center;"><img src="${url}" style="max-width:90vw;max-height:88vh;border-radius:10px;box-shadow:0 4px 32px rgba(0,0,0,.6);"><div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:10px;">Bấm để đóng</div></div>`;
  m.style.display='flex';
}

// ── Helper for accounts edit (no string escaping issues) ──
window._cachedUsers = [];

// Store users when accounts page loads
const _origRenderAccounts = window.renderAccountsPage || function(){};
// Patch via MutationObserver approach: intercept fetch
const _origFetchForAccounts = window.fetch;

async function openEditAccountModalById(userId) {
  // Fetch fresh user data
  let users = window._cachedUsers;
  if (!users.length) {
    try {
      const r = await fetch('/api/users');
      if (r.ok) users = await r.json();
      window._cachedUsers = users;
    } catch(e) {}
  }
  const u = users.find(x => x.id === userId);
  if (!u) { showToast('Không tìm thấy tài khoản', true); return; }
  openEditAccountModal(u.id, u.username, u.displayName||'', u.role, u.linkedStaffId||'', u.linkedStudentId||'');
}

// Cache users when accounts page loads
const _origRenderAccountsPage2 = window.renderAccountsPage;
if (typeof _origRenderAccountsPage2 === 'function') {
  window.renderAccountsPage = async function() {
    await _origRenderAccountsPage2();
    // Re-fetch and cache
    try {
      const r = await fetch('/api/users');
      if (r.ok) window._cachedUsers = await r.json();
    } catch(e) {}
  };
}

// ════════════════════════════════════════
// PAYROLL INLINE EDITING – tất cả cột trừ tên
// ════════════════════════════════════════
window.recalcPayroll = function() {
  const month = document.getElementById('pr-month')?.value || new Date().toISOString().slice(0,7);
  const content = document.getElementById('payroll-content');
  if (!content) return;

  const rows = staff.map(s => {
    const att = (window._staffAttCache || []).filter(a =>
      String(a.staffId) === String(s.id) && a.date && a.date.startsWith(month)
    );
    const workDays = att.length;
    let lateMin = 0;
    const manualLateField = 'manualLateMin_' + month;
    if (s[manualLateField] !== undefined) {
      lateMin = s[manualLateField];
    } else {
      att.forEach(a => {
        if (a.checkIn && a.date) {
          const dObj = new Date(a.date);
          const dowMap = ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
          const dayStr = dowMap[dObj.getDay()];
          
          let earliestMin = Infinity;
          classes.forEach(c => {
            if (c.teacher && s.name && c.teacher.toLowerCase().includes(s.name.toLowerCase())) {
              (c.schedule || []).forEach(sch => {
                const sDay = sch.day.replace('ứ ', '');
                const tDay = dayStr.replace('ứ ', '');
                if (sch.day === dayStr || sDay === tDay) {
                  const [ch, cm] = sch.start.split(':').map(Number);
                  const cMin = ch*60 + cm;
                  if (cMin < earliestMin) earliestMin = cMin;
                }
              });
            }
          });
          
          if (earliestMin !== Infinity) {
            const [h,m] = a.checkIn.split(':').map(Number);
            const checkInMin = h*60+m;
            if (checkInMin > earliestMin) {
               lateMin += (checkInMin - earliestMin);
            }
          }
        }
      });
    }
    let totalMin = 0;
    att.forEach(a => {
      if (a.checkIn && a.checkOut) {
        const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
        totalMin += Math.max(0, toMin(a.checkOut) - toMin(a.checkIn));
      }
    });
    const baseSalary  = Number(s.salary || 0);
    const hourlyRate  = Number(s.hourlyRate || 0);
    const sessionRate = Number(s.sessionRate || 0);
    const customDeduct= Number(s.customDeduct || 0);
    let teachingSessions = 0;
    (attendance || []).forEach(a => {
      if (!a.date || !a.date.startsWith(month)) return;
      const cls = classes.find(c => String(c.id) === String(a.classId));
      if (cls && cls.teacher && cls.teacher.includes(s.name)) {
        if (Object.values(a.records||{}).filter(v=>v==='present').length > 0) teachingSessions++;
      }
    });
    let pay = baseSalary;
    if (hourlyRate > 0) pay += Math.round(totalMin / 60 * hourlyRate);
    if (sessionRate > 0) pay += teachingSessions * sessionRate;
    const lateDeduct = s.lateDeduct !== undefined && s.lateDeduct !== '' ? Number(s.lateDeduct) : (lateMin * 1000);
    const finalPay = Math.max(0, pay - lateDeduct - customDeduct);
    return { s, workDays, teachingSessions, totalMin, lateMin, lateDeduct, customDeduct, baseSalary, hourlyRate, sessionRate, pay, finalPay };
  });

  if (!rows.length) {
    content.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">
      Chưa có nhân sự. <a onclick="showPage('staff')" style="color:var(--gold);cursor:pointer;font-weight:700;">Vào GV & Nhân Viên để thêm →</a>
    </div></div>`;
    return;
  }

  const totalPayroll = rows.reduce((a,r) => a + r.finalPay, 0);

  const statsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
    <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalPayroll)}</div><div class="stat-label">Tổng Chi Lương</div></div>
    <div class="stat-card"><div class="stat-value">${rows.length}</div><div class="stat-label">Nhân Viên</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#22c55e">${rows.reduce((a,r)=>a+r.workDays,0)}</div><div class="stat-label">Tổng Ngày Công</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#ef4444">${rows.reduce((a,r)=>a+r.lateMin,0)}</div><div class="stat-label">Tổng Phút Muộn</div></div>
  </div>`;

  // Editable cell helper
  const editable = (val, field, staffId, type='number', placeholder='') =>
    `<div contenteditable="true" data-field="${field}" data-staffid="${staffId}"
      onblur="savePayrollField(this)"
      style="min-width:60px;padding:4px 6px;border-radius:6px;border:1px solid transparent;
             text-align:right;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;
             cursor:text;transition:border-color .15s;"
      onfocus="this.style.borderColor='var(--gold)'"
      onblur2="this.style.borderColor='transparent'"
      title="Bấm để chỉnh sửa">${val||0}</div>`;

  window._payrollMonth = month;
  const tableRows = rows.map(({s,workDays,teachingSessions,totalMin,lateMin,lateDeduct,customDeduct,baseSalary,hourlyRate,sessionRate,finalPay}) => `
    <tr>
      <td>
        <div style="font-weight:700;color:var(--navy)">${s.name}</div>
        <div style="font-size:11px;color:var(--muted)">${s.role||'–'}</div>
      </td>
      <td style="text-align:center;font-weight:700">${workDays}</td>
      <td style="text-align:center">${teachingSessions}</td>
      <td style="text-align:center">${Math.floor(totalMin/60)}h${totalMin%60?totalMin%60+'p':''}</td>
      <td style="text-align:center;color:${lateMin>0?'#ef4444':'#22c55e'};font-weight:700">
        ${editable(lateMin, 'manualLateMin_' + window._payrollMonth, s.id, 'number')}
      </td>
      <td>${editable(baseSalary,'salary',s.id)}</td>
      <td>${editable(hourlyRate,'hourlyRate',s.id)}</td>
      <td>${editable(sessionRate,'sessionRate',s.id)}</td>
      <td><div style="color:#ef4444;font-size:12px;font-weight:700;">-${editable(lateDeduct,'lateDeduct',s.id)}</div></td>
      <td><div style="color:#ef4444;font-size:12px;font-weight:700;">-${editable(customDeduct,'customDeduct',s.id)}</div></td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
          <span style="font-size:11px;color:#555;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
            title="${s.bankAccount||''}">${s.bankAccount||'–'}</span>
          <button onclick="editBankInfo(${s.id})" style="background:var(--cream2);border:none;border-radius:4px;padding:1px 5px;font-size:10px;cursor:pointer;">✎</button>
          ${s.bankAccount?`<button onclick="showStaffBankQR(${s.id})" style="background:none;border:none;cursor:pointer;font-size:12px;" title="QR">⬡</button>`:''}
        </div>
      </td>
      <td>${editable(s.payrollNote||'','payrollNote',s.id,'text')}</td>
      <td style="text-align:right;font-weight:800;color:var(--gold);font-size:14px;white-space:nowrap">${fmt(finalPay)}</td>
    </tr>`).join('');

  content.innerHTML = statsHtml + `
    <div style="background:#f0fdf4;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#166534;">
      💡 Bấm trực tiếp vào ô <b>Lương CB, Giá/Giờ, Giá/Buổi, Trừ Lỗi, Ghi Chú</b> để chỉnh sửa – lưu tự động khi click ra ngoài
    </div>
    <div class="card"><div class="table-wrap"><table style="min-width:1100px;">
      <thead><tr>
        <th>Nhân Viên</th>
        <th style="text-align:center">Ngày Công</th>
        <th style="text-align:center">Buổi Dạy</th>
        <th style="text-align:center">Tổng Giờ</th>
        <th style="text-align:center">Phút Muộn</th>
        <th style="text-align:right">Lương CB ✎</th>
        <th style="text-align:right">Giá/Giờ ✎</th>
        <th style="text-align:right">Giá/Buổi ✎</th>
        <th style="text-align:right">Trừ Muộn</th>
        <th style="text-align:right">Trừ Lỗi ✎</th>
        <th style="text-align:center">STK Ngân Hàng</th>
        <th>Ghi Chú ✎</th>
        <th style="text-align:right">Thực Lĩnh</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr style="background:var(--cream2);">
        <td colspan="12" style="font-weight:800;color:var(--navy);text-align:right;padding:12px 14px;">TỔNG CHI LƯƠNG:</td>
        <td style="font-weight:800;color:var(--gold);font-size:16px;text-align:right;padding:12px 14px;">${fmt(totalPayroll)}</td>
      </tr></tfoot>
    </table></div></div>`;

  window._payrollCache = { month, rows };
};

// Save editable payroll field on blur
async function savePayrollField(el) {
  el.style.borderColor = 'transparent';
  const field   = el.dataset.field;
  const staffId = Number(el.dataset.staffid);
  const rawVal  = el.textContent.trim();
  const s = staff.find(x => x.id === staffId);
  if (!s || !field) return;

  const numFields = ['salary','hourlyRate','sessionRate','customDeduct'];
    if (numFields.includes(field) || field.startsWith('manualLateMin_')) {
    const val = Number(rawVal.replace(/[^\d.-]/g,'')) || 0;
    s[field] = val;
    el.textContent = val; // normalize display
  } else {
    s[field] = rawVal;
  }

  try {
    await saveData();
    // Flash green feedback
    el.style.background = '#dcfce7';
    setTimeout(() => { el.style.background = ''; }, 800);
    recalcPayroll();
  } catch(e) { showToast('Lỗi lưu!', true); }
}

// ════════════════════════════════════════
// TEACHER PERSONAL PAYROLL VIEW
// ════════════════════════════════════════
async function renderTeacherPayroll() {
  const page = document.getElementById('page-payroll');
  if (!page) return;
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId;
  if (!myStaffId) {
    page.innerHTML = `<div class="page-header"><div class="page-title">Bảng <span>Lương Của Tôi</span></div></div>
      <div class="card"><div style="padding:20px;text-align:center;color:var(--muted)">Tài khoản chưa liên kết với nhân sự. Liên hệ admin để cài linkedStaffId.</div></div>`;
    return;
  }
  const s = staff.find(x => String(x.id) === String(myStaffId));
  if (!s) {
    page.innerHTML = `<div class="page-header"><div class="page-title">Bảng <span>Lương Của Tôi</span></div></div>
      <div class="card"><div style="padding:20px;text-align:center;color:var(--muted)">Không tìm thấy thông tin nhân sự.</div></div>`;
    return;
  }

  const now = new Date();
  // Last 3 months payroll
  const months = [];
  for (let i=2; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(d.toISOString().slice(0,7));
  }

  const r = await fetch(`/api/staff-attendance?month=${months[2]}`).catch(()=>null);
  const myAtt = (r&&r.ok ? await r.json() : []).filter(a => String(a.staffId)===String(myStaffId));

  let lateMin = 0;
  myAtt.forEach(a => {
    if (a.checkIn) { const [h,m]=a.checkIn.split(':').map(Number); const d=(h*60+m)-480; if(d>15) lateMin+=d-15; }
  });
  const baseSalary = Number(s.salary||0);
  const lateDeduct = lateMin * 1000;
  const customDeduct = Number(s.customDeduct||0);
  const finalPay = Math.max(0, baseSalary - lateDeduct - customDeduct);

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Bảng Lương <span>Của Tôi</span></div>
      <div class="page-sub">Tháng ${months[2].replace('-','/')}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">
      <div class="stat-card"><div class="stat-value">${myAtt.length}</div><div class="stat-label">Ngày Công</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#22c55e">${myAtt.filter(a=>a.checkIn&&a.checkOut).length}</div><div class="stat-label">Đủ Ca</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#ef4444">${lateMin}</div><div class="stat-label">Phút Muộn</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(finalPay)}</div><div class="stat-label">Thực Lĩnh</div></div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title" style="margin-bottom:14px;">Chi Tiết Lương Tháng ${months[2].replace('-','/')}</div>
      <div style="font-size:13px;">
        ${[
          ['Lương cơ bản', fmt(baseSalary), 'var(--navy)'],
          ['Trừ đi muộn', lateDeduct>0?'-'+fmt(lateDeduct):'–', '#ef4444'],
          ['Trừ lỗi', customDeduct>0?'-'+fmt(customDeduct):'–', '#ef4444'],
          ['Thực lĩnh', fmt(finalPay), 'var(--gold)'],
        ].map(([k,v,col])=>`
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--cream2);">
            <span style="color:var(--muted)">${k}</span>
            <span style="font-weight:800;color:${col};font-size:${k==='Thực lĩnh'?'16':'13'}px">${v}</span>
          </div>`).join('')}
      </div>
      ${s.bankAccount?`<div style="margin-top:14px;background:var(--cream);border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
        <div><div style="color:var(--muted);font-size:11px;margin-bottom:2px;">Nhận lương qua</div><div style="font-weight:700">${s.bankName||'Ngân hàng'} – ${s.bankAccount}</div></div>
        <button onclick="showStaffBankQR(${s.id})" class="btn btn-gold" style="padding:6px 12px;font-size:12px;">⬡ QR</button>
      </div>`:''}
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">Lịch Sử Chấm Công Tháng Này</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th><th>Phương Thức</th><th>Ghi Chú</th></tr></thead>
        <tbody>${myAtt.length ? myAtt.sort((a,b)=>a.date>b.date?-1:1).map(a=>{
          let late=0; if(a.checkIn){const[h,m]=a.checkIn.split(':').map(Number);const d=(h*60+m)-480;if(d>15)late=d-15;}
          return `<tr>
            <td>${fmtDate(a.date)}</td>
            <td style="color:${late>0?'#ef4444':'#22c55e'};font-weight:700">${a.checkIn||'–'}${late>0?` <span style="font-size:10px">(muộn ${late}p)</span>`:''}</td>
            <td style="color:#3b82f6;font-weight:700">${a.checkOut||'<span style="color:#aaa">Chưa out</span>'}</td>
            <td><span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--cream2)">${a.method==='faceid'?'FaceID':'Thủ công'}</span></td>
            <td style="font-size:11px;color:var(--muted)">${a.note||'–'}</td>
          </tr>`;}).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Chưa có dữ liệu</td></tr>'}</tbody>
      </table></div>
    </div>`;
}

// ════════════════════════════════════════
// TEACHER ROLE: override showPage('payroll')
// ════════════════════════════════════════
const _origSPPayrollTeacher = window.showPage;
window.showPage = function(id) {
  if (id === 'payroll' && window.VS_ROLE === 'teacher') {
    // Teacher sees personal payroll
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('page-payroll');
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n=>{
      if((n.getAttribute('onclick')||'').includes("'payroll'")) n.classList.add('active');
    });
    renderTeacherPayroll();
    return;
  }
  if (typeof _origSPPayrollTeacher === 'function') _origSPPayrollTeacher(id);
};

// ════════════════════════════════════════
// vsId DISPLAY IN PROFILE + SEARCH
// ════════════════════════════════════════
// Show vsId in student profile header
const _origOpenStudentProfile = window.openStudentProfile;
window.openStudentProfile = function(studentId) {
  if (typeof _origOpenStudentProfile === 'function') _origOpenStudentProfile(studentId);
  // Patch header to show vsId badge after modal renders
  setTimeout(() => {
    const header = document.querySelector('#student-profile-modal .logo-title, #student-profile-modal [style*="font-size:18px"]');
    const s = students.find(x=>x.id===studentId);
    if (s && s.vsId) {
      const badge = document.getElementById('profile-vsid-badge');
      if (!badge) {
        const b = document.createElement('span');
        b.id = 'profile-vsid-badge';
        b.textContent = s.vsId;
        b.style.cssText = 'background:var(--gold);color:#1a1a1a;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:800;margin-left:8px;vertical-align:middle;';
        if (header) header.appendChild(b);
      }
    }
  }, 100);
};

// Show vsId in global search results
const _origRunSearch = window.runGlobalSearch;
window.runGlobalSearch = function(q) {
  if (typeof _origRunSearch === 'function') _origRunSearch(q);
  // Patch student results to show vsId
  setTimeout(() => {
    const res = document.getElementById('global-search-results');
    if (!res) return;
    res.querySelectorAll('[onclick*="openStudentProfile"]').forEach(el => {
      if (!el.querySelector('.vsid-tag')) {
        const idMatch = el.getAttribute('onclick').match(/openStudentProfile\((\d+)\)/);
        if (idMatch) {
          const s = students.find(x=>x.id===Number(idMatch[1]));
          if (s && s.vsId) {
            const tag = document.createElement('span');
            tag.className = 'vsid-tag';
            tag.textContent = s.vsId;
            tag.style.cssText = 'background:var(--navy);color:var(--gold);border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;margin-left:4px;';
            const nameEl = el.querySelector('div > div:first-child');
            if (nameEl) nameEl.appendChild(tag);
          }
        }
      }
    });
  }, 50);
};

// Show vsId in attendance dropdowns
const _origInitAttendance = window.initAttendancePage;
window.initAttendancePage = function() {
  if (typeof _origInitAttendance === 'function') _origInitAttendance();
  // Patch student names in attendance to include vsId
  setTimeout(() => {
    document.querySelectorAll('.att-student-name').forEach(el => {
      const sid = el.dataset.studentId;
      if (sid) {
        const s = students.find(x=>String(x.id)===String(sid));
        if (s && s.vsId && !el.querySelector('.vsid-mini')) {
          const tag = document.createElement('span');
          tag.className = 'vsid-mini';
          tag.textContent = s.vsId;
          tag.style.cssText = 'font-size:9px;color:var(--muted);margin-left:4px;font-weight:700;';
          el.appendChild(tag);
        }
      }
    });
  }, 300);
};

// Auto-assign vsId when saving new staff via saveStaff override if missed
const _origSaveStaffAsync = window.saveAsync;

// ════════════════════════════════════════
// SIMPLIFIED CHECK-IN / CHECK-OUT
// ════════════════════════════════════════
// Override openCheckInModal với giao diện đơn giản hơn
window.openCheckInModal = function() {
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId;
  let m = document.getElementById('checkin-modal');
  if (!m) { m=document.createElement('div');m.id='checkin-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';

  const now = new Date();
  const timeNow = now.toTimeString().slice(0,5);
  const dateNow = now.toISOString().slice(0,10);

  const staffSel = (role==='teacher'&&myStaffId)
    ? `<input type="hidden" id="ci-staff" value="${myStaffId}"><div style="font-size:14px;font-weight:700;color:var(--navy);padding:6px 0 12px">${(staff||[]).find(s=>String(s.id)===String(myStaffId))?.name||'Tôi'}</div>`
    : `<select id="ci-staff" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:12px;box-sizing:border-box;">${(staff||[]).map(s=>`<option value="${s.id}">${s.vsId||''} – ${s.name}</option>`).join('')}</select>`;

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px 20px;max-width:420px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-weight:800;font-size:16px;color:var(--navy)">Chấm Công</div>
      <button onclick="document.getElementById('checkin-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>

    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">NHÂN VIÊN</label>
    ${staffSel}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">NGÀY</label>
        <input type="date" id="ci-date" value="${dateNow}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:700;color:#22c55e;display:block;margin-bottom:4px;">🟢 GIỜ VÀO (CHECK-IN)</label>
        <input type="time" id="ci-in" value="${timeNow}" style="width:100%;border:1.5px solid #22c55e;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>

    <!-- Photo capture area -->
    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:6px;">📷 ẢNH CHẤM CÔNG (tùy chọn)</label>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <button onclick="openCICamera()" style="flex:1;background:var(--navy);color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📸 Mở Camera</button>
      <label style="flex:1;background:var(--cream2);color:var(--navy);border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;text-align:center;font-family:'Be Vietnam Pro',sans-serif;">
        📁 Chọn File<input type="file" accept="image/*" style="display:none" onchange="loadCIFile(this)">
      </label>
      <button onclick="clearCIPhotoFull()" style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:8px 10px;font-size:12px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;" title="Xóa ảnh">✕</button>
    </div>
    <div id="ci-camera-area" style="display:none;background:#000;border-radius:10px;overflow:hidden;margin-bottom:8px;">
      <video id="ci-video-feed" autoplay playsinline style="width:100%;max-height:200px;object-fit:cover;display:block;"></video>
      <button onclick="snapCIFull()" style="width:100%;background:var(--gold);color:#1a1a1a;border:none;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">📸 Chụp</button>
      <canvas id="ci-canvas-feed" style="display:none;"></canvas>
    </div>
    <div id="ci-preview-area" style="display:none;margin-bottom:12px;position:relative;">
      <img id="ci-preview-img" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;border:2px solid #22c55e;">
      <div style="position:absolute;top:6px;right:6px;background:rgba(34,197,94,.9);color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;">✓ Ảnh sẵn sàng</div>
    </div>

    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">GHI CHÚ</label>
    <input type="text" id="ci-note" placeholder="Ghi chú nếu có..." style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;">

    <button onclick="submitCIFull()" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">
      🟢 XÁC NHẬN CHECK-IN
    </button>
  </div>`;
  m.style.display='flex';
  window._ciPhotoDataURL = null;
};

let _ciFeedStream = null;

async function openCICamera() {
  const area = document.getElementById('ci-camera-area');
  const video = document.getElementById('ci-video-feed');
  if (!area || !video) return;
  try {
    _ciFeedStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    video.srcObject = _ciFeedStream;
    area.style.display = 'block';
  } catch(e) { showToast('Không thể mở camera: '+e.message, true); }
}

function snapCIFull() {
  const video = document.getElementById('ci-video-feed');
  const canvas = document.getElementById('ci-canvas-feed');
  if (!video||!canvas) return;
  canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video,0,0);
  const dataURL = canvas.toDataURL('image/jpeg',0.82);
  window._ciPhotoDataURL = dataURL;
  document.getElementById('ci-preview-img').src = dataURL;
  document.getElementById('ci-preview-area').style.display = 'block';
  document.getElementById('ci-camera-area').style.display = 'none';
  if (_ciFeedStream) { _ciFeedStream.getTracks().forEach(t=>t.stop()); _ciFeedStream=null; }
}

function loadCIFile(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._ciPhotoDataURL = e.target.result;
    document.getElementById('ci-preview-img').src = e.target.result;
    document.getElementById('ci-preview-area').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearCIPhotoFull() {
  window._ciPhotoDataURL = null;
  document.getElementById('ci-preview-area').style.display = 'none';
  document.getElementById('ci-camera-area').style.display = 'none';
  if (_ciFeedStream) { _ciFeedStream.getTracks().forEach(t=>t.stop()); _ciFeedStream=null; }
}

window.submitCheckIn = async function() { await submitCIFull(); };

async function submitCIFull() {
  const staffId = document.getElementById('ci-staff')?.value;
  const date    = document.getElementById('ci-date')?.value;
  const checkIn = document.getElementById('ci-in')?.value;
  const note    = document.getElementById('ci-note')?.value||'';
  if (!staffId||!date||!checkIn) { showToast('Vui lòng điền đủ thông tin!', true); return; }
  const btn = document.querySelector('#checkin-modal button[onclick*="submitCIFull"]');
  if (btn) { btn.disabled=true; btn.textContent='Đang lưu...'; }
  try {
    const r = await fetch('/api/staff-attendance',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({staffId,date,checkIn,method:'manual',note,photo:window._ciPhotoDataURL||null})});
    const d = await r.json();
    if (!r.ok) { showToast(d.error||'Lỗi lưu!', true); if(btn){btn.disabled=false;btn.textContent='🟢 XÁC NHẬN CHECK-IN';} return; }
    showToast(`✅ Check-in ${checkIn} thành công!`);
    clearCIPhotoFull();
    document.getElementById('checkin-modal').style.display='none';
    renderStaffAttendancePage();
  } catch(e) { showToast('Lỗi kết nối!', true); if(btn){btn.disabled=false;btn.textContent='🟢 XÁC NHẬN CHECK-IN';} }
}

// Quick manual check-out button in detail tab
window.quickCheckOut = async function(attData) {
  const a = typeof attData==='string' ? JSON.parse(attData) : attData;
  const now = new Date().toTimeString().slice(0,5);

  // Show quick modal
  let m = document.getElementById('checkout-modal');
  if (!m) { m=document.createElement('div');m.id='checkout-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const s = (staff||[]).find(x=>String(x.id)===String(a.staffId));
  m.innerHTML=`<div style="background:#fff;border-radius:18px;padding:24px 20px;max-width:360px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:6px;">Check-out</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:14px;">${s?s.name:'Nhân viên'} · Check-in lúc ${a.checkIn||'?'}</div>
    <label style="font-size:11px;font-weight:700;color:#ef4444;display:block;margin-bottom:4px;">🔴 GIỜ RA (CHECK-OUT)</label>
    <input type="time" id="co-time" value="${now}" style="width:100%;border:1.5px solid #ef4444;border-radius:10px;padding:10px;font-size:14px;font-weight:700;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
    <label style="font-size:11px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">GHI CHÚ</label>
    <input type="text" id="co-note" value="${a.note||''}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;">
    <div style="display:flex;gap:8px;">
      <button onclick="confirmCheckOut('${a.staffId}','${a.date}','${a.checkIn||''}')" style="flex:1;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">🔴 XÁC NHẬN</button>
      <button onclick="document.getElementById('checkout-modal').style.display='none'" style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>
  </div>`;
  m.style.display='flex';
};

async function confirmCheckOut(staffId, date, checkIn) {
  const checkOut = document.getElementById('co-time')?.value;
  const note = document.getElementById('co-note')?.value||'';
  if (!checkOut) { showToast('Vui lòng nhập giờ ra!', true); return; }
  const r = await fetch('/api/staff-attendance',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({staffId,date,checkIn,checkOut,note,method:'manual'})});
  if (r.ok) {
    showToast(`✅ Check-out ${checkOut} thành công!`);
    document.getElementById('checkout-modal').style.display='none';
    renderStaffAttendancePage();
  } else showToast('Lỗi lưu check-out!', true);
}

// ════════════════════════════════════════
// AUTO-CREATE ACCOUNTS FOR HV & GV
// ════════════════════════════════════════

async function autoCreateStudentAccount(student) {
  const vsId = student.vsId;
  if (!vsId) return;
  const username = vsId.toLowerCase(); // hv0001
  const displayName = student.name;
  try {
    const r = await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        username,
        password: '12345678',
        displayName,
        role: 'student',
        linkedStudentId: String(student.id)
      })
    });
    const d = await r.json();
    if (r.ok) {
      showToast(`✅ Đã tạo tài khoản học viên: ${username} / 12345678`);
    } else if (d.error && d.error.includes('đã tồn tại')) {
      // Already exists - just link
      console.log('Account already exists for', vsId);
    } else {
      console.warn('Auto-create student account error:', d.error);
    }
  } catch(e) { console.error('Auto-create error:', e); }
}

async function autoCreateStaffAccount(s) {
  const vsId = s.vsId;
  if (!vsId) return;
  const username = vsId.toLowerCase(); // gv0001
  const isTeacher = (s.role||'').toLowerCase().includes('giáo viên') || (s.role||'').toLowerCase().includes('gv') || (s.role||'').toLowerCase().includes('teacher');
  try {
    const r = await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        username,
        password: '12345678',
        displayName: s.name,
        role: isTeacher ? 'teacher' : 'staff',
        linkedStaffId: String(s.id)
      })
    });
    const d = await r.json();
    if (r.ok) {
      showToast(`✅ Đã tạo tài khoản ${isTeacher?'giáo viên':'nhân viên'}: ${username} / 12345678`);
    } else if (d.error && d.error.includes('đã tồn tại')) {
      console.log('Account already exists for', vsId);
    } else {
      console.warn('Auto-create staff account error:', d.error);
    }
  } catch(e) { console.error('Auto-create error:', e); }
}

// ── Migrate: create accounts for existing HV/GV that don't have one ──
async function migrateCreateMissingAccounts() {
  // Fetch current users to check who already has an account
  const r = await fetch('/api/users').catch(()=>null);
  if (!r||!r.ok) return;
  const users = await r.json();
  const existingUsernames = new Set(users.map(u=>u.username.toLowerCase()));

  let created = 0;
  let dbChanged = false;

  // Check students
  let maxHv = (students||[]).reduce((max,s)=>{
    const m = parseInt((s.vsId||'').replace(/\D/g,''))||0;
    return m > max ? m : max;
  }, 0);

  for (const s of (students||[])) {
    if (!s.vsId) {
      maxHv++;
      s.vsId = `HV${String(maxHv).padStart(4,'0')}`;
      dbChanged = true;
    }
    const username = s.vsId.toLowerCase();
    if (!existingUsernames.has(username)) {
      await autoCreateStudentAccount(s);
      created++;
      await new Promise(r => setTimeout(r, 100)); // small delay
    }
  }

  // Check staff
  let maxGv = (staff||[]).reduce((max,s)=>{
    const m = parseInt((s.vsId||'').replace(/\D/g,''))||0;
    return m > max ? m : max;
  }, 0);

  for (const s of (staff||[])) {
    if (!s.vsId) {
      maxGv++;
      s.vsId = `GV${String(maxGv).padStart(4,'0')}`;
      dbChanged = true;
    }
    const username = s.vsId.toLowerCase();
    if (!existingUsernames.has(username)) {
      await autoCreateStaffAccount(s);
      created++;
      await new Promise(r => setTimeout(r, 100));
    }
  }

  if (dbChanged) {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students, staff })
    });
  }

  if (created > 0 || dbChanged) {
    showToast(`✅ Đã tạo ${created} tài khoản và đồng bộ Mã HV/GV mới!`);
    if (document.getElementById('page-accounts')?.classList.contains('active')) {
      renderAccountsPage();
    }
  }
  return created > 0 || dbChanged ? 1 : 0;
}

// ── Add "Đồng Bộ Tài Khoản" button to accounts page ──
const _origRenderAccountsPageV3 = window.renderAccountsPage;
if (typeof _origRenderAccountsPageV3 === 'function') {
  window.renderAccountsPage = async function() {
    await _origRenderAccountsPageV3();
    // Add sync button if not present
    const toolbar = document.querySelector('#page-accounts .toolbar');
    if (toolbar && !document.getElementById('sync-accounts-btn')) {
      const btn = document.createElement('button');
      btn.id = 'sync-accounts-btn';
      btn.className = 'btn';
      btn.style.cssText = 'background:var(--navy);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
      btn.innerHTML = '🔄 Đồng Bộ TK';
      btn.title = 'Tự động tạo tài khoản cho HV/GV chưa có tài khoản';
      btn.onclick = async () => {
        btn.disabled = true; btn.textContent = 'Đang đồng bộ...';
        const n = await migrateCreateMissingAccounts();
        btn.disabled = false; btn.innerHTML = '🔄 Đồng Bộ TK';
        if (n === 0) showToast('Tất cả đã có tài khoản!');
        renderAccountsPage();
      };
      toolbar.appendChild(btn);
    }
  };
}

// ════════════════════════════════════════
// ACCOUNTS PAGE LAYOUT FIX (force full width)
// ════════════════════════════════════════
// Override showPage to fix accounts layout every time
const _origSPAccounts = window.showPage;
window.showPage = function(id) {
  if (typeof _origSPAccounts === 'function') _origSPAccounts(id);
  if (id === 'accounts') {
    requestAnimationFrame(() => {
      const page = document.getElementById('page-accounts');
      const wrap = document.getElementById('accounts-table-wrap');
      if (page) {
        page.style.cssText += ';width:100%!important;overflow-x:auto!important;box-sizing:border-box!important;';
      }
      if (wrap) {
        wrap.style.cssText += ';width:100%!important;overflow-x:auto!important;box-sizing:border-box!important;';
      }
    });
  }
};
