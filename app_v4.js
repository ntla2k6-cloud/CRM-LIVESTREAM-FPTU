// ═══════════════════════════════════════════════════
//  app_v4.js – Vinsoul Academy v4.0
//  Load AFTER app_v3.js
//  1. Tìm kiếm toàn cục
//  2. Fix phòng học (lưu DB)
//  3. Gia hạn khóa học + lịch sử thanh toán
//  4. Lịch dạy cá nhân giáo viên
//  5. Xuất Excel thật (.xlsx)
//  6. Thống kê dự báo doanh thu
// ═══════════════════════════════════════════════════

// ════════════════════════════════════════
// 1. TÌM KIẾM TOÀN CỤC
// ════════════════════════════════════════
function initGlobalSearch() {
  // Inject search bar INSIDE .main as a top bar (not fixed, not overlapping sidebar)
  if (document.getElementById('global-search-wrap')) return;

  // Create a top bar inside .main
  const mainEl = document.querySelector('.main');
  if (!mainEl) return;

  const bar = document.createElement('div');
  bar.id = 'global-search-bar';
  bar.style.cssText = 'position:sticky;top:0;z-index:50;background:var(--cream);padding:10px 0 14px;margin-bottom:4px;';
  bar.innerHTML = `
    <div id="global-search-wrap" style="position:relative;max-width:480px;">
      <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--muted);pointer-events:none;">🔍</span>
      <input id="global-search-input" placeholder="Tìm kiếm học viên, lớp, nhân sự..." autocomplete="off"
        style="width:100%;border:1.5px solid var(--cream2);border-radius:10px;padding:9px 14px 9px 36px;
               font-size:13px;font-family:'Be Vietnam Pro',sans-serif;background:#fff;
               box-shadow:0 1px 6px rgba(0,0,0,.06);box-sizing:border-box;outline:none;transition:border-color .2s;"
        oninput="runGlobalSearch(this.value)"
        onfocus="this.style.borderColor='var(--gold)';showSearchResults()"
        onblur="setTimeout(()=>{hideSearchResults();this.style.borderColor='var(--cream2)';},200)">
      <div id="global-search-results" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;
        background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.15);
        max-height:360px;overflow-y:auto;border:1px solid var(--cream2);z-index:200;font-family:'Be Vietnam Pro',sans-serif;">
      </div>
    </div>`;

  // Insert as first child of .main
  mainEl.insertBefore(bar, mainEl.firstChild);
}

function runGlobalSearch(q) {
  q = q.trim().toLowerCase();
  const res = document.getElementById('global-search-results');
  if (!res) return;
  if (!q || q.length < 2) { res.style.display = 'none'; return; }

  const results = [];

  // Search students
  (students||[]).forEach(s => {
    const score = [s.name,s.phone,s.parent,s.subject].filter(Boolean).join(' ').toLowerCase();
    if (score.includes(q)) {
      results.push({
        type:'student', icon:'👤', label:s.name,
        sub:`${s.subject||''} · ${s.phone||''}`,
        action:`openStudentProfile(${s.id})`
      });
    }
  });

  // Search staff
  (staff||[]).forEach(s => {
    if ((s.name||'').toLowerCase().includes(q) || (s.role||'').toLowerCase().includes(q)) {
      results.push({ type:'staff', icon:'👩‍🏫', label:s.name, sub:s.role||'', action:`showPage('staff')` });
    }
  });

  // Search classes
  (classes||[]).forEach(c => {
    if ((c.name||'').toLowerCase().includes(q) || (c.subject||'').toLowerCase().includes(q)) {
      results.push({ type:'class', icon:'🏫', label:c.name, sub:`${c.subject||''} · ${c.teacher||''}`, action:`showPage('classes')` });
    }
  });

  // Search leads
  (leads||[]).forEach(l => {
    if ((l.name||'').toLowerCase().includes(q) || (l.phone||'').toLowerCase().includes(q)) {
      results.push({ type:'lead', icon:'🎯', label:l.name, sub:`${l.course||''} · ${l.status||''}`, action:`showPage('leads')` });
    }
  });

  // Page shortcuts
  const pages = [
    {k:'dashboard',l:'Dashboard',i:'◈'},{k:'students',l:'Danh Sách HV',i:'👥'},
    {k:'attendance',l:'Điểm Danh',i:'✅'},{k:'payroll',l:'Bảng Lương',i:'💰'},
    {k:'report',l:'Báo Cáo',i:'📊'},{k:'schedule',l:'TKB',i:'📅'},
    {k:'staff-attendance',l:'Chấm Công',i:'🕐'},{k:'care',l:'Chăm Sóc HV',i:'💬'},
  ];
  pages.forEach(p => {
    if (p.l.toLowerCase().includes(q)||p.k.toLowerCase().includes(q)) {
      results.push({ type:'page', icon:p.i, label:`→ Trang: ${p.l}`, sub:'', action:`showPage('${p.k}')` });
    }
  });

  if (!results.length) {
    res.innerHTML = `<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">Không tìm thấy kết quả cho "${q}"</div>`;
    res.style.display = 'block';
    return;
  }

  const colorMap = { student:'#3b82f6', staff:'#22c55e', class:'#a855f7', lead:'#f59e0b', page:'var(--navy)' };
  res.innerHTML = results.slice(0,12).map(r => `
    <div onclick="${r.action};hideSearchResults();document.getElementById('global-search-input').value=''"
      style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--cream);"
      onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='#fff'">
      <div style="width:32px;height:32px;border-radius:8px;background:${colorMap[r.type]}18;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${r.icon}</div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--navy);">${r.label}</div>
        ${r.sub?`<div style="font-size:11px;color:var(--muted);">${r.sub}</div>`:''}
      </div>
      <div style="margin-left:auto;font-size:10px;padding:2px 7px;border-radius:4px;background:${colorMap[r.type]}18;color:${colorMap[r.type]};font-weight:700;">${{student:'HV',staff:'NV',class:'Lớp',lead:'Lead',page:'Trang'}[r.type]||''}</div>
    </div>`).join('');
  res.style.display = 'block';
}

function showSearchResults() {
  const v = document.getElementById('global-search-input')?.value||'';
  if (v.length >= 2) runGlobalSearch(v);
}
function hideSearchResults() {
  const r = document.getElementById('global-search-results');
  if (r) r.style.display = 'none';
}

// ════════════════════════════════════════
// 2. FIX PHÒNG HỌC – LƯU VÀO DATABASE
// ════════════════════════════════════════
let _rooms = [];

async function loadRooms() {
  const db = await fetch('/api/load').then(r=>r.json()).catch(()=>null);
  _rooms = (db && db.rooms) || [
    {id:1,name:'Phòng Piano 1',capacity:2,subject:'Piano',color:'#3b82f6'},
    {id:2,name:'Phòng Piano 2',capacity:2,subject:'Piano',color:'#6366f1'},
    {id:3,name:'Phòng Guitar',capacity:4,subject:'Guitar',color:'#22c55e'},
    {id:4,name:'Phòng Dance',capacity:20,subject:'Dance',color:'#ef4444'},
    {id:5,name:'Phòng Vẽ',capacity:8,subject:'Vẽ',color:'#f59e0b'},
  ];
  return _rooms;
}

async function saveRooms(rooms) {
  await fetch('/api/save', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ rooms })
  });
  _rooms = rooms;
}

// Override renderRoomsPage to use DB-backed rooms
window.renderRoomsPage = async function() {
  const content = document.getElementById('rooms-content');
  if (!content) return;
  content.innerHTML = '<div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-text">Đang tải...</div></div>';

  const rooms = await loadRooms();
  const days = ['T2','T3','T4','T5','T6','T7','CN'];
  const daysFull = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];

  const roomCards = rooms.map(r => `
    <div style="background:#fff;border:1.5px solid var(--cream2);border-radius:12px;padding:12px 14px;position:relative;">
      <div style="width:10px;height:10px;border-radius:50%;background:${r.color||'var(--navy)'};display:inline-block;margin-right:6px;"></div>
      <span style="font-weight:700;font-size:13px;color:var(--navy);">${r.name}</span>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${r.subject} · ${r.capacity} người</div>
      <button onclick="editRoom(${r.id})" style="position:absolute;top:8px;right:30px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--muted);">✎</button>
      <button onclick="deleteRoom(${r.id})" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;font-size:13px;color:#ef4444;">✕</button>
    </div>`).join('');

  const roomRows = rooms.map(room => {
    const dayCells = daysFull.map(day => {
      const roomClasses = classes.filter(c =>
        String(c.room) === String(room.id) || c.room === room.name
      ).filter(c => (c.schedule||[]).some(s=>s.day===day));

      if (!roomClasses.length) return `<td style="border:1px solid #eee;background:#fafafa;"></td>`;
      return `<td style="border:1px solid #eee;padding:4px;vertical-align:top;">
        ${roomClasses.map(c => {
          const slot = (c.schedule||[]).find(s=>s.day===day);
          return `<div style="background:${room.color||'var(--navy)'}20;border-left:3px solid ${room.color||'var(--navy)'};border-radius:0 6px 6px 0;padding:5px 7px;margin-bottom:3px;font-size:11px;">
            <div style="font-weight:700;color:var(--navy)">${c.name}</div>
            <div style="color:var(--muted)">${slot?slot.start+'-'+(slot.end||'?'):''}</div>
          </div>`;
        }).join('')}
      </td>`;
    }).join('');

    return `<tr>
      <td style="border:1px solid #eee;padding:8px 10px;white-space:nowrap;background:var(--cream);">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${room.color||'var(--navy)'}"></div>
          <div><div style="font-weight:700;font-size:12px;color:var(--navy)">${room.name}</div><div style="font-size:10px;color:var(--muted)">${room.capacity} người</div></div>
        </div>
      </td>
      ${dayCells}
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;flex:1;">${roomCards}</div>
      <button onclick="openAddRoomModal()" class="btn btn-gold" style="white-space:nowrap;">+ Thêm Phòng</button>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">Lịch Sử Dụng Phòng Theo Tuần</div>
      <div class="table-wrap">
        <table style="min-width:700px;">
          <thead><tr><th>Phòng</th>${days.map(d=>`<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
          <tbody>${roomRows||'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Chưa có phòng</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
};

window.openAddRoomModal = function(editId) {
  const existing = editId ? _rooms.find(r=>r.id===editId) : null;
  let m = document.getElementById('room-modal');
  if (!m) { m=document.createElement('div');m.id='room-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML=`<div style="background:#fff;border-radius:18px;padding:24px;max-width:380px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:16px;">${existing?'Sửa Phòng':'Thêm Phòng Học'}</div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Tên Phòng</label>
    <input id="rm-name" value="${existing?existing.name:''}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;" placeholder="VD: Phòng Piano 1">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Môn Chính</label>
        <input id="rm-subject" value="${existing?existing.subject:''}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;" placeholder="Piano">
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Sức Chứa</label>
        <input id="rm-cap" type="number" value="${existing?existing.capacity:4}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;">
      </div>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Màu Nhận Dạng</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      ${['#3b82f6','#22c55e','#a855f7','#f97316','#ef4444','#14b8a6','#f59e0b','#ec4899'].map(col=>`
        <div onclick="document.getElementById('rm-color').value='${col}';document.querySelectorAll('.rm-col-opt').forEach(x=>x.style.transform='scale(1)');this.style.transform='scale(1.3)'"
          class="rm-col-opt" style="width:26px;height:26px;border-radius:50%;background:${col};cursor:pointer;transition:.15s;${existing&&existing.color===col?'transform:scale(1.3)':''}"></div>`).join('')}
      <input type="hidden" id="rm-color" value="${existing?existing.color:'#3b82f6'}">
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="saveRoom(${editId||'null'})" class="btn btn-gold" style="flex:1;">💾 Lưu</button>
      <button onclick="document.getElementById('room-modal').style.display='none'" style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Hủy</button>
    </div>
  </div>`;
  m.style.display='flex';
};

async function saveRoom(editId) {
  const name = document.getElementById('rm-name')?.value?.trim();
  const subject = document.getElementById('rm-subject')?.value?.trim()||'';
  const capacity = Number(document.getElementById('rm-cap')?.value||4);
  const color = document.getElementById('rm-color')?.value||'#3b82f6';
  if (!name) { showToast('Vui lòng nhập tên phòng!',true); return; }
  const rooms = [..._rooms];
  if (editId) {
    const i = rooms.findIndex(r=>r.id===editId);
    if (i!==-1) rooms[i] = {...rooms[i], name, subject, capacity, color};
  } else {
    rooms.push({ id:Date.now(), name, subject, capacity, color });
  }
  await saveRooms(rooms);
  document.getElementById('room-modal').style.display='none';
  showToast('Đã lưu phòng học!');
  window.renderRoomsPage();
}

function editRoom(id) { window.openAddRoomModal(id); }

async function deleteRoom(id) {
  if (!confirm('Xóa phòng này?')) return;
  const rooms = _rooms.filter(r=>r.id!==id);
  await saveRooms(rooms);
  showToast('Đã xóa phòng!');
  window.renderRoomsPage();
}

// ════════════════════════════════════════
// 3. GIA HẠN KHÓA HỌC + LỊCH SỬ THANH TOÁN
// ════════════════════════════════════════
function openRenewalModal(studentId) {
  const s = students.find(x=>x.id===studentId); if(!s) return;
  let m = document.getElementById('renewal-modal');
  if (!m) { m=document.createElement('div');m.id='renewal-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  const today = new Date().toISOString().slice(0,10);
  const renewStart = s.end || today;
  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px;max-width:440px;width:100%;font-family:'Be Vietnam Pro',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div><div style="font-weight:800;font-size:16px;color:var(--navy)">Gia Hạn Khóa Học</div>
      <div style="font-size:12px;color:var(--muted)">${s.name} · ${s.subject}</div></div>
      <button onclick="document.getElementById('renewal-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="background:var(--cream);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:12px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted)">Khóa cũ kết thúc:</span><span style="font-weight:700">${fmtDate(s.end)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;"><span style="color:var(--muted)">Học phí cũ:</span><span style="font-weight:700;color:var(--gold)">${fmt(s.amount)}</span></div>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Gói Học Mới</label>
    <select id="rn-pkg" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
      <option>1 tháng/8 buổi</option>
      <option selected>3 tháng/24 buổi</option>
      <option>6 tháng/48 buổi</option>
      <option>1 năm/96 buổi</option>
    </select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ngày Bắt Đầu Mới</label>
        <input type="date" id="rn-start" value="${renewStart}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;" onchange="calcRenewalEnd()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Ngày Kết Thúc (tự tính)</label>
        <input type="date" id="rn-end" readonly style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;box-sizing:border-box;background:var(--cream);">
      </div>
    </div>
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Học Phí Mới (đ)</label>
    <input type="number" id="rn-amount" value="${s.amount||0}" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:10px;box-sizing:border-box;">
    <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">Hình Thức Thanh Toán</label>
    <select id="rn-payment" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:9px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;box-sizing:border-box;">
      <option>Đã Chuyển Khoản</option>
      <option>Tiền Mặt</option>
      <option>Chưa Thanh Toán</option>
    </select>
    <button onclick="submitRenewal(${studentId})" class="btn btn-gold" style="width:100%;">🔄 Xác Nhận Gia Hạn</button>
  </div>`;
  m.style.display='flex';
  setTimeout(calcRenewalEnd, 100);
}

async function calcRenewalEnd() {
  const start = document.getElementById('rn-start')?.value;
  const pkg   = document.getElementById('rn-pkg')?.value||'';
  const endEl = document.getElementById('rn-end');
  if (!start || !pkg || !endEl) return;
  const m2 = pkg.match(/(\d+)\s*buổi/);
  if (!m2) return;
  try {
    const r = await fetch('/api/calc-end-date',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({startDate:start,totalSessions:parseInt(m2[1])})});
    const d = await r.json();
    if (d.endDate) endEl.value = d.endDate;
  } catch(e) {}
}

async function submitRenewal(studentId) {
  const s = students.find(x=>x.id===studentId); if(!s) return;
  const pkg     = document.getElementById('rn-pkg')?.value||'';
  const start   = document.getElementById('rn-start')?.value;
  const end     = document.getElementById('rn-end')?.value;
  const amount  = Number(document.getElementById('rn-amount')?.value||0);
  const payment = document.getElementById('rn-payment')?.value||'';
  if (!start) { showToast('Vui lòng nhập ngày bắt đầu!',true); return; }

  // Save payment history for old course
  if (s.amount && s.payment !== 'Chưa Thanh Toán') {
    await fetch('/api/payment-history',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({studentId:s.id,studentName:s.name,subject:s.subject,amount:s.amount,method:s.payment,date:s.paydate||s.start,note:`Khóa cũ: ${fmtDate(s.start)} - ${fmtDate(s.end)}`})});
  }

  // Update student record
  s.pkg = pkg; s.start = start; s.end = end;
  s.amount = amount; s.payment = payment;
  s.paydate = payment !== 'Chưa Thanh Toán' ? new Date().toISOString().slice(0,10) : '';

  await saveData();
  document.getElementById('renewal-modal').style.display='none';
  showToast(`Đã gia hạn khóa học cho ${s.name}!`);
  renderStudentTable();
}

// Add renewal button to student table
const _origRenderStudentTable = window.renderStudentTable;
window.renderStudentTable = function() {
  if (typeof _origRenderStudentTable === 'function') _origRenderStudentTable();
  // Patch buttons after render via DOM observation
  setTimeout(() => {
    document.querySelectorAll('[data-student-id]').forEach(row => {
      const sid = Number(row.dataset.studentId);
      const s = students.find(x=>x.id===sid);
      if (!s || !s.end) return;
      const daysLeft = Math.ceil((new Date(s.end) - new Date()) / (1000*60*60*24));
      if (daysLeft <= 14) {
        const actBtns = row.querySelector('.action-btns');
        if (actBtns && !actBtns.querySelector('.renew-btn')) {
          const btn = document.createElement('button');
          btn.className = 'btn-icon renew-btn';
          btn.title = 'Gia Hạn Khóa';
          btn.style.color = '#22c55e';
          btn.textContent = '🔄';
          btn.onclick = e => { e.stopPropagation(); openRenewalModal(sid); };
          actBtns.insertBefore(btn, actBtns.firstChild);
        }
      }
    });
  }, 200);
};

// Payment history modal
async function showPaymentHistory(studentId) {
  const s = students.find(x=>x.id===studentId); if(!s) return;
  const r = await fetch(`/api/payment-history/${studentId}`).catch(()=>null);
  const history = r&&r.ok ? await r.json() : [];

  let m = document.getElementById('payment-hist-modal');
  if (!m) { m=document.createElement('div');m.id='payment-hist-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  const totalPaid = history.reduce((a,p)=>a+Number(p.amount||0),0);
  const rows = history.length
    ? history.slice().reverse().map((p,i)=>`<tr>
        <td style="font-size:11px;color:var(--muted)">${history.length-i}</td>
        <td style="font-size:13px">${fmtDate(p.date)}</td>
        <td style="font-size:12px">${p.method||'–'}</td>
        <td style="font-weight:700;color:var(--gold);text-align:right">${fmt(p.amount)}</td>
        <td style="font-size:11px;color:var(--muted)">${p.note||'–'}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">Chưa có lịch sử thanh toán</td></tr>';

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px;max-width:520px;width:100%;font-family:'Be Vietnam Pro',sans-serif;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div><div style="font-weight:800;font-size:16px;color:var(--navy)">Lịch Sử Thanh Toán</div>
      <div style="font-size:12px;color:var(--muted)">${s.name}</div></div>
      <button onclick="document.getElementById('payment-hist-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    <div style="background:var(--cream);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;">
      <span style="font-size:13px;color:var(--muted)">Tổng đã đóng:</span>
      <span style="font-weight:800;font-size:16px;color:var(--gold)">${fmt(totalPaid)}</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Ngày</th><th>Hình Thức</th><th style="text-align:right">Số Tiền</th><th>Ghi Chú</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div style="display:flex;gap:8px;margin-top:14px;">
      <button onclick="openRenewalModal(${studentId})" class="btn btn-gold" style="flex:1;">🔄 Gia Hạn</button>
      <button onclick="document.getElementById('payment-hist-modal').style.display='none'" style="flex:1;border:1.5px solid #eee;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;">Đóng</button>
    </div>
  </div>`;
  m.style.display='flex';
}

// ════════════════════════════════════════
// 4. LỊCH DẠY CÁ NHÂN GIÁO VIÊN
// ════════════════════════════════════════
async function renderTeacherSchedulePage() {
  const role = window.VS_ROLE;
  const myStaffId = window.VS_USER?.linkedStaffId;

  // Find target staff
  let targetStaffId = window._forceTeacherSchedId || myStaffId;
  
  // Admin/staff: show picker if no linkedStaffId
  if (!targetStaffId && (role === 'admin' || role === 'staff')) {
    if (staff.length === 0) {
      // No staff yet - show demo modal with current user as "teacher"
      targetStaffId = 'demo';
    } else {
      // Show staff picker modal
      openTeacherSchedPicker();
      return;
    }
  }

  if (!targetStaffId) { showToast('Tài khoản này chưa liên kết với nhân sự nào. Vào Quản Trị TK để cài linkedStaffId.', true); return; }

  const r = await fetch(`/api/teacher-schedule/${targetStaffId}`).catch(()=>null);
  const data = r&&r.ok ? await r.json() : null;

  let m = document.getElementById('teacher-sched-modal');
  if (!m) { m=document.createElement('div');m.id='teacher-sched-modal';m.onclick=e=>{if(e.target===m)m.style.display='none';};document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  if (!data) {
    m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:30px;max-width:400px;width:100%;text-align:center;font-family:'Be Vietnam Pro',sans-serif;">
      <div style="font-size:36px;margin-bottom:10px;">📅</div>
      <div style="font-weight:800;color:var(--navy);margin-bottom:6px;">Không tải được lịch</div>
      <button onclick="document.getElementById('teacher-sched-modal').style.display='none'" class="btn btn-gold">Đóng</button>
    </div>`;
    m.style.display='flex'; return;
  }

  const today = data.today;
  const todaySlots = data.todaySlots || [];
  const allClasses = data.allClasses || [];
  const daysFull = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];

  // Build weekly timetable for this teacher
  const weekHtml = daysFull.map(day => {
    const dayClasses = allClasses.filter(c => (c.schedule||[]).some(s=>s.day===day));
    if (!dayClasses.length) return '';
    const isToday = day === today;
    return `<div style="margin-bottom:10px;">
      <div style="font-weight:700;font-size:12px;color:${isToday?'var(--gold)':'var(--navy)'};margin-bottom:6px;${isToday?'border-bottom:2px solid var(--gold);padding-bottom:3px':''}">
        ${day}${isToday?' ← Hôm nay':''}
      </div>
      ${dayClasses.map(c=>{
        const slot = (c.schedule||[]).find(s=>s.day===day);
        const cnt = students.filter(s=>String(s.classid)===String(c.id)).length;
        return `<div style="background:${isToday?'var(--gold)18':'var(--cream)'};border-left:3px solid ${isToday?'var(--gold)':'var(--navy)'};border-radius:0 8px 8px 0;padding:8px 10px;margin-bottom:5px;">
          <div style="font-weight:700;font-size:12px;color:var(--navy)">${c.name}</div>
          <div style="font-size:11px;color:var(--muted)">${slot?slot.start+(slot.end?'-'+slot.end:''):''} · ${c.subject}</div>
          <div style="font-size:11px;color:var(--muted)">${cnt} học viên${c.room?' · '+c.room:''}</div>
        </div>`;
      }).join('')}
    </div>`;
  }).filter(Boolean).join('');

  // Staff picker for admin
  const staffPickerHtml = (role==='admin'||role==='staff') && staff.length > 1
    ? `<select onchange="reloadTeacherSched(this.value)" style="border:1.5px solid #e0e0e0;border-radius:8px;padding:6px 10px;font-size:12px;font-family:'Be Vietnam Pro',sans-serif;margin-bottom:14px;">
        ${staff.map(s=>`<option value="${s.id}" ${String(s.id)===String(targetStaffId)?'selected':''}>${s.name}</option>`).join('')}
       </select>` : '';

  m.innerHTML=`<div style="background:#fff;border-radius:20px;padding:24px;max-width:500px;width:100%;font-family:'Be Vietnam Pro',sans-serif;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div><div style="font-weight:800;font-size:16px;color:var(--navy)">Lịch Dạy – ${data.name}</div>
      <div style="font-size:12px;color:var(--muted)">${allClasses.length} lớp · Hôm nay: ${today}</div></div>
      <button onclick="document.getElementById('teacher-sched-modal').style.display='none'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#aaa;">✕</button>
    </div>
    ${staffPickerHtml}
    ${todaySlots.length ? `
    <div style="background:var(--gold)12;border:1.5px solid var(--gold);border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="font-weight:800;font-size:13px;color:var(--gold);margin-bottom:10px;">⚡ Hôm Nay – ${today}</div>
      ${todaySlots.map(s=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gold)20;">
          <div><div style="font-weight:700;font-size:13px;color:var(--navy)">${s.className}</div>
          <div style="font-size:11px;color:var(--muted)">${s.subject}${s.room?' · '+s.room:''}</div></div>
          <div style="text-align:right"><div style="font-weight:800;font-size:14px;color:var(--gold)">${s.start}${s.end?'-'+s.end:''}</div>
          <div style="font-size:11px;color:var(--muted)">${s.studentCount} HV</div></div>
        </div>`).join('')}
    </div>` : `<div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;margin-bottom:16px;font-size:13px;color:var(--muted);">Hôm nay không có lịch dạy</div>`}
    <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:10px;">Lịch Cả Tuần</div>
    ${weekHtml||'<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">Chưa có lớp nào được phân công</div>'}
  </div>`;
  m.style.display='flex';
}

async function reloadTeacherSched(staffId) {
  const r = await fetch(`/api/teacher-schedule/${staffId}`).catch(()=>null);
  const data = r&&r.ok ? await r.json() : null;
  if (!data) return;
  // Store and re-render
  window._lastTeacherSchedData = data;
  renderTeacherSchedulePage();
}

// ════════════════════════════════════════
// 5. XUẤT EXCEL THẬT (.xlsx)
// ════════════════════════════════════════
function exportXLSX(type, extraParams) {
  const month = extraParams?.month || new Date().toISOString().slice(0,7);
  const url = `/api/export-xlsx/${type}${type==='payroll'?`?month=${month}`:''}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Đang tải file Excel...');
}

// Add Excel buttons to existing export buttons
function addXLSXButtons() {
  // Revenue page
  const revPage = document.getElementById('page-revenue');
  if (revPage) {
    const toolbar = revPage.querySelector('.toolbar');
    if (toolbar && !toolbar.querySelector('.xlsx-btn')) {
      const btn = document.createElement('button');
      btn.className = 'btn xlsx-btn';
      btn.style.cssText = 'background:#1d6f42;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
      btn.innerHTML = '📊 Excel';
      btn.onclick = () => exportXLSX('revenue');
      toolbar.appendChild(btn);
    }
  }

  // Students page
  const stuPage = document.getElementById('page-students');
  if (stuPage) {
    const toolbar = stuPage.querySelector('.toolbar');
    if (toolbar && !toolbar.querySelector('.xlsx-student-btn')) {
      const btn = document.createElement('button');
      btn.className = 'btn xlsx-student-btn';
      btn.style.cssText = 'background:#1d6f42;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:"Be Vietnam Pro",sans-serif;';
      btn.innerHTML = '📊 Excel';
      btn.onclick = () => exportXLSX('students');
      toolbar.appendChild(btn);
    }
  }
}

// Global Excel export shortcut
window.exportXLSX = exportXLSX;

// ════════════════════════════════════════
// 6. THỐNG KÊ DỰ BÁO DOANH THU
// ════════════════════════════════════════
async function renderForecastSection() {
  const r = await fetch('/api/forecast').catch(()=>null);
  const forecast = r&&r.ok ? await r.json() : [];
  if (!forecast.length) return;

  // Inject into report page if visible
  const reportContent = document.getElementById('report-content');
  if (!reportContent || !document.getElementById('page-report')?.classList.contains('active')) return;
  if (document.getElementById('forecast-section')) return;

  const total3m = forecast.reduce((a,f)=>a+f.potential,0);
  const section = document.createElement('div');
  section.id = 'forecast-section';
  section.innerHTML = `
    <div class="card" style="margin-top:16px;border:2px solid var(--gold)20;background:linear-gradient(135deg,#fff,var(--cream));">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div><div class="card-title">🔮 Dự Báo Doanh Thu 3 Tháng Tới</div>
        <div style="font-size:12px;color:var(--muted)">Dựa trên khóa học sắp hết hạn cần gia hạn</div></div>
        <div style="text-align:right"><div style="font-size:20px;font-weight:900;color:var(--gold)">${fmt(total3m)}</div>
        <div style="font-size:11px;color:var(--muted)">tiềm năng tổng 3 tháng</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${forecast.map(f=>`
          <div style="background:#fff;border-radius:12px;padding:14px;border:1px solid var(--cream2);">
            <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:8px;">${f.month}</div>
            <div style="font-size:24px;font-weight:900;color:var(--gold);margin-bottom:4px;">${fmt(f.potential)}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">${f.count} HV sắp hết khóa</div>
            ${f.students.slice(0,3).map(s=>`
              <div style="font-size:11px;color:var(--navy);padding:4px 0;border-top:1px solid var(--cream);">
                ${s.name} · ${fmtDate(s.end)}
              </div>`).join('')}
            ${f.count > 3 ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">+${f.count-3} học viên khác</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
  reportContent.appendChild(section);
}

// ════════════════════════════════════════
// HOOK OVERRIDES + INIT
// ════════════════════════════════════════

// Override renderReportPage to also show forecast
const _origRenderReport = window.renderReportPage;
window.renderReportPage = function() {
  if (typeof _origRenderReport === 'function') _origRenderReport();
  setTimeout(renderForecastSection, 100);
};

// Patch showPage for teacher schedule + xlsx buttons
const _origSPv4 = window.showPage;
window.showPage = function(id) {
  if (id === 'teacher-schedule') { renderTeacherSchedulePage(); return; }
  if (typeof _origSPv4 === 'function') _origSPv4(id);
  setTimeout(() => {
    addXLSXButtons();
    if (id === 'report') setTimeout(renderForecastSection, 150);
  }, 100);
};

// Add nav shortcuts for new features
function addV4NavItems() {
  // Add "Lịch Dạy" under teacher nav
  const teacherSection = document.querySelector('.vs-hide-student');
  if (teacherSection) {
    const existing = document.getElementById('nav-teacher-sched');
    if (!existing) {
      const item = document.createElement('div');
      item.id = 'nav-teacher-sched';
      item.className = 'nav-item vs-hide-student';
      item.onclick = () => renderTeacherSchedulePage();
      item.innerHTML = '<span class="nav-icon">📅</span> Lịch Dạy Của Tôi';
      // Insert after attendance
      const attItem = [...document.querySelectorAll('.nav-item')].find(el => el.textContent.includes('Điểm Danh'));
      if (attItem) attItem.parentElement.insertBefore(item, attItem.nextSibling);
    }
  }
}

// Init
const _origInitV4 = window.initAppAfterLogin;
window.initAppAfterLogin = async function() {
  if (typeof _origInitV4 === 'function') _origInitV4();
  initGlobalSearch();
  setTimeout(addV4NavItems, 300);
  setTimeout(addXLSXButtons, 500);
};
