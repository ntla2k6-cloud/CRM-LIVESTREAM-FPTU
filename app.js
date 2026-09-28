// ── STATE ──
let students      = [];
let classes       = [];
let customCourses = [];
let customPrices  = {};
let staffRoles    = [];
let staff         = [];
let attendance    = [];
let leads         = [];
let expenses      = [];
let makeups       = [];
let templates     = [];
let editStudentId = null;
let editStaffId   = null;
let editLeadId    = null;
let editMakeupId  = null;
let editTemplateId= null;
let studentFilter = 'all';
let studentClassFilter = 'all';
let studentSubjectFilter = 'all';
let staffFilter   = 'all';
let leadFilter    = 'all';
let makeupFilter  = 'all';
let consultTab    = 'process';


// ── STATIC COURSE LIST FOR FILTER TABS ──
const STATIC_COURSES = [
  {name:'Piano',      emoji:'🎹', match:'Piano'},
  {name:'Guitar',     emoji:'🎸', match:'Guitar'},
  {name:'Violin',     emoji:'🎻', match:'Violin'},
  {name:'Ukulele',    emoji:'🪕', match:'Ukulele'},
  {name:'Vẽ',         emoji:'🎨', match:'Vẽ'},
  {name:'Ballet',     emoji:'🩰', match:'Ballet'},
  {name:'Dance',      emoji:'💃', match:'Dance'},
  {name:'Khiêu Vũ',   emoji:'🕺', match:'Khiêu Vũ'},
  {name:'Múa Cổ Trang',emoji:'👘', match:'Múa Cổ Trang'},
  {name:'Thanh Nhạc', emoji:'🎤', match:'Thanh Nhạc'},
  {name:'Luyện Thi',  emoji:'🏆', match:'Luyện Thi'},
  {name:'Cảm Thụ Âm Nhạc', emoji:'🎼', match:'Cảm Thụ Âm Nhạc'},
  {name:'Piano Đệm Hát',   emoji:'🎹🎤', match:'Piano Đệm Hát'},
  {name:'Trống',      emoji:'🥁', match:'Trống'},
];

// ── HELPERS ──
const fmt     = n => Number(n||0).toLocaleString('vi-VN') + ' đ';
// ── Flatpickr: init tất cả date inputs thành DD/MM/YYYY ──
function initDatePickers(container) {
  const root = container || document;
  root.querySelectorAll('input[type="date"]').forEach(el => {
    if (el._fpInited) return;
    el._fpInited = true;
    const stored = el.value; // YYYY-MM-DD
    el.type = 'text';
    el.placeholder = 'DD/MM/YYYY';
    const fp = flatpickr(el, {
      locale: 'vn',
      dateFormat: 'd/m/Y',
      allowInput: true,
      defaultDate: stored || null,
      onChange: function(selectedDates, dateStr) {
        // Store as YYYY-MM-DD in dataset for form reads
        if (selectedDates[0]) {
          const d = selectedDates[0];
          const iso = d.getFullYear()+'-'
            +String(d.getMonth()+1).padStart(2,'0')+'-'
            +String(d.getDate()).padStart(2,'0');
          el.dataset.isoValue = iso;
        }
      }
    });
    // Override .value getter/setter to return ISO for form processing
    Object.defineProperty(el, '_isoValue', {
      get() { return el.dataset.isoValue || ''; },
      set(v) { el.dataset.isoValue = v; if(v) fp.setDate(v,false,'Y-m-d'); }
    });
  });
}

// Patch getElementById for date inputs to return ISO value
const _origGEBI = document.getElementById.bind(document);
function getDateVal(id) {
  const el = _origGEBI(id);
  if (!el) return '';
  return el.dataset.isoValue || el.value || '';
}

const fmtDate = d => { if (!d) return '–'; const p = d.split('-'); if (p.length === 3) return p[2]+'/'+p[1]+'/'+p[0]; return d; };
// Lưu dữ liệu lên server (không chặn UI)
function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices, expenses, staffRoles })
  }).catch(e => console.error('Lỗi lưu server:', e));
}

// Lưu dữ liệu lên server và chờ kết quả (dùng khi cần chắc chắn)
async function saveAsync() {
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices, expenses, staffRoles })
    });
    if (!r.ok) {
      const d = await r.json();
      showToast('Lỗi lưu dữ liệu: ' + (d.error || r.status), true);
      return false;
    }
    showToast('💾 Đã lưu dữ liệu!');
    return true;
  } catch (e) {
    showToast('Mất kết nối đến server!', true);
    return false;
  }
}

// ── DELETE MODAL ──
function confirmDelete(name, fn) {
  const nameEl = document.getElementById('del-modal-name');
  const btnEl = document.getElementById('del-confirm-btn');
  const modalEl = document.getElementById('del-modal');
  if (!nameEl || !btnEl || !modalEl) {
    // Fallback to native confirm if modal HTML not loaded
    if (confirm('Bạn có chắc muốn xóa ' + name + '?')) { fn(); }
    return;
  }
  nameEl.textContent = name;
  btnEl.onclick = () => { fn(); closeDelModal(); };
  modalEl.classList.add('open');
}
function closeDelModal() { const m = document.getElementById('del-modal'); if (m) m.classList.remove('open'); }

// ── NAVIGATION ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    const oc = n.getAttribute('onclick') || '';
    if (oc.includes("'" + id + "'") || oc.includes('"' + id + '"')) n.classList.add('active');
  });
  const map = { students: renderStudentTable, staff: renderStaffTable, dashboard: renderDashboard, revenue: renderRevenue, leads: renderLeadTable, classes: renderClassTable, 'class-detail':()=>{}, schedule: renderSchedule, attendance: initAttendancePage, makeup: renderMakeupTable, consult: initConsultPage, accounts: renderAccountsPage, 'staff-attendance': ()=>{ if(typeof renderStaffAttendancePage==='function') renderStaffAttendancePage(); }, 'student-portal': ()=>{ if(typeof renderStudentPortal==='function') renderStudentPortal(); }, audit: ()=>{ if(typeof renderAuditPage==='function') renderAuditPage(); }, zalo: ()=>{ if(typeof renderZaloConfig==='function') renderZaloConfig(); }, settings: ()=>{ if(typeof renderSettingsRoles==='function') renderSettingsRoles(); if(typeof renderSettingsCourses==='function') renderSettingsCourses(); } };
  if (map[id]) map[id]();
}
function startAddStudent() { editStudentId = null; clearStudentForm(); showPage('add-student'); }
// Auto end-date hook
setTimeout(function(){
  var fs=document.getElementById('f-start');
  var fp=document.getElementById('f-package');
  if(fs&&!fs._hooked){fs.addEventListener('change',function(){if(typeof autoCalcEndDate==='function')autoCalcEndDate();});fs._hooked=true;}
  if(fp&&!fp._hooked){fp.addEventListener('change',function(){
    if(typeof autoCalcEndDate==='function')autoCalcEndDate();
    const tInput = document.getElementById('f-totalSessions');
    if (tInput && fp.value) {
      const m = fp.value.match(/(\d+)\s*bu\u1ed5i/i);
      if (m) tInput.value = m[1];
    }
  });fp._hooked=true;}
},400);
function startAddClass()   { editClassId   = null; clearClassForm();   showPage('add-class'); }
function startAddStaff()   { editStaffId   = null; clearStaffForm();   showPage('add-staff'); }
function startAddLead()    { editLeadId    = null; clearLeadForm();    showPage('add-lead'); }

// ── COURSE DATA ──
const CD={
  piano:{name:'PIANO',emoji:'🎹',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  guitar:{name:'GUITAR',emoji:'🎸',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  violin:{name:'VIOLIN',emoji:'🎻',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  ukulele:{name:'UKULELE',emoji:'🪕',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  ve:{name:'VẼ',emoji:'🎨',sections:[{title:'Vẽ Mầm Non',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]},{title:'Vẽ Căn Bản',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3300000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1300000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1650000}]},{title:'Ký Họa / Màu Nước / Màu Marker',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]},{title:'Màu Acrylic / Digital Art',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:4800000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1800000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:2400000}]}]},
  ballet:{name:'BALLET',emoji:'🩰',sections:[{title:'Ballet 3–5 Tuổi',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]},{title:'Ballet 6–9 Tuổi',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]}]},
  dance:{name:'DANCE',emoji:'💃',sections:[{title:'Dance',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]}]},
  'khieuvũ':{name:'KHIÊU VŨ',emoji:'🕺',sections:[{title:'Khiêu Vũ',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]}]},
  muacotrang:{name:'MÚA CỔ TRANG',emoji:'👘',sections:[{title:'Múa Cổ Trang',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]}]},
  thanhnhac:{name:'THANH NHẠC',emoji:'🎤',sections:[{title:'Căn Bản',rows:[{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  'luyen-thi':{name:'LUYỆN THI QUỐC TẾ',emoji:'🏆',sections:[{title:'Luyện Thi – Guitar',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000},{desc:'Luyện 3-1 · 1T/8b',amount:2200000},{desc:'Luyện 2-1 · 1T/8b',amount:3000000},{desc:'Luyện 1-1 · 1T/8b',amount:4200000}]},{title:'Luyện Thi – Violin',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000}]},{title:'Luyện Thi – Piano',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000}]},{title:'Luyện Thi – Vẽ',rows:[{desc:'Lớp nhóm · 3T/24b',amount:7200000},{desc:'Lớp nhóm · 1T/8b',amount:2600000},{desc:'Đóng 2 lần · 3T/24b',amount:3600000}]}]},
  hocthu:{name:'HỌC THỬ',emoji:'⭐',sections:[{title:'Các Loại Học Thử',rows:[{desc:'Học thử lớp nhóm',amount:100000},{desc:'Học thử 2-1',amount:250000},{desc:'Học thử 1-1',amount:500000}]}]},
  camthu:{name:'CẢM THỤ ÂM NHẠC',emoji:'🎼',sections:[{title:'Cảm Thụ Âm Nhạc Miễn Phí',rows:[{desc:'Lớp nhóm · 24 buổi · Miễn phí',amount:0}]}]},
  pianodemhat:{name:'PIANO ĐỆM HÁT',emoji:'🎹🎤',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  trong:{name:'TRỐNG',emoji:'🥁',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  khac:{name:'MỤC KHÁC',emoji:'🗂️',sections:[
    {title:'⭐ Học Thử',rows:[{desc:'Học thử lớp nhóm (10:1)',amount:100000},{desc:'Học thử 2-1',amount:250000},{desc:'Học thử 1-1',amount:500000}]},
    {title:'🩰 Đồ Ballet',rows:[{desc:'Đồ rời – Size 130(4bộ) · 140(2bộ) · 150(2bộ) · 160(1bộ) · 170(1bộ)',amount:300000},{desc:'Đồ liền',amount:200000}]},
    {title:'📚 Sách',rows:[{desc:'Sách Grade',amount:50000},{desc:'Sách Faber AVT (in VN: 250k / in Mỹ: 450k)',amount:60000},{desc:'Sách Guitar',amount:50000},{desc:'Sách người lớn',amount:100000}]},
    {title:'👟 Giày & Tất',rows:[{desc:'Giày 1 đôi lớn',amount:150000},{desc:'Giày 1 đôi bé cao cấp',amount:120000},{desc:'Giày 1 đôi bé thường',amount:60000},{desc:'Tất 1 đôi',amount:50000}]},
    {title:'🏠 Phòng Nhảy',rows:[{desc:'Phòng lớn Tầng 1 (không ML: 230k)',amount:300000},{desc:'Phòng nhỏ Tầng 2 (không ML: 200k)',amount:250000},{desc:'Thuê tháng từ 1 tháng',amount:5000000},{desc:'Thuê tháng từ 3 tháng',amount:4000000}]},
    {title:'🎹 Thuê Phòng Piano',rows:[{desc:'Theo giờ (check lịch trống)',amount:150000},{desc:'Gói 3 tháng – 2 buổi/tuần cố định',amount:3000000}]}
  ]}
};

function getAllCourses() {
  // Merge static CD + customCourses
  const all = {...CD};
  customCourses.forEach(c => { all[c.key] = c; });
  return all;
}

function openCourse(key){
  const allC = getAllCourses();
  const c = allC[key];
  if (!c) return;
  document.getElementById('modal-emoji').textContent = c.emoji;
  document.getElementById('modal-title').textContent = c.name;
  renderCourseModalContent(key, c);
  document.getElementById('course-modal').classList.add('open');
}

function renderCourseModalContent(key, c) {
  const prices = customPrices[key] || {};
  let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
    <button class="btn btn-outline" style="font-size:10px;padding:5px 12px;" onclick="toggleCourseEdit('${key}')">✏️ Chỉnh Sửa Học Phí</button>
  </div>`;
  c.sections.forEach((s,si)=>{
    html+=`<div class="price-section"><div class="price-section-title">${s.title}</div>`;
    s.rows.forEach((r,ri)=>{
      const priceKey = si+'_'+ri;
      const curAmount = prices[priceKey] !== undefined ? prices[priceKey] : r.amount;
      html+=`<div class="price-row">
        <div class="price-desc">${r.desc}</div>
        <div class="price-amount" id="pa_${key}_${priceKey}">${curAmount===0?'Miễn phí':fmt(curAmount)}</div>
        <input type="number" class="price-edit-input" id="pi_${key}_${priceKey}" value="${curAmount}" style="display:none;width:130px;padding:5px 8px;border:1.5px solid var(--gold);border-radius:8px;font-size:12px;font-weight:700;color:var(--navy);background:var(--cream);text-align:right;" min="0">
      </div>`;
    });
    html+='</div>';
  });
  html+=`<div id="course-edit-actions" style="display:none;margin-top:14px;padding-top:14px;border-top:1.5px solid var(--cream2);display:none;gap:9px;" class="form-actions">
    <button class="btn btn-gold" onclick="saveCourseEdit('${key}')">💾 Lưu Học Phí</button>
    <button class="btn btn-outline" onclick="resetCourseEdit('${key}')">↺ Khôi Phục Mặc Định</button>
  </div>`;
  document.getElementById('modal-content').innerHTML = html;
}

function toggleCourseEdit(key) {
  const inputs = document.querySelectorAll(`[id^="pi_${key}_"]`);
  const amounts = document.querySelectorAll(`[id^="pa_${key}_"]`);
  const actions = document.getElementById('course-edit-actions');
  const isEditing = inputs[0] && inputs[0].style.display !== 'none';
  inputs.forEach(el => el.style.display = isEditing ? 'none' : 'inline-block');
  amounts.forEach(el => el.style.display = isEditing ? '' : 'none');
  if (actions) actions.style.display = isEditing ? 'none' : 'flex';
}

function saveCourseEdit(key) {
  const allC = getAllCourses();
  const c = allC[key];
  if (!c) return;
  if (!customPrices[key]) customPrices[key] = {};
  c.sections.forEach((s,si) => {
    s.rows.forEach((r,ri) => {
      const priceKey = si+'_'+ri;
      const input = document.getElementById(`pi_${key}_${priceKey}`);
      if (input) customPrices[key][priceKey] = Number(input.value) || 0;
    });
  });
  save();
  renderCourseModalContent(key, c);
  showToast('Đã lưu học phí!');
}

function resetCourseEdit(key) {
  if (customPrices[key]) { delete customPrices[key]; save(); }
  const allC = getAllCourses();
  renderCourseModalContent(key, allC[key]);
  showToast('Đã khôi phục học phí mặc định!');
}

// ── PACKAGE OPTIONS PER COURSE ──
const COURSE_PACKAGES = {
  'Piano':                              ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','L\u1edbp 3-1 \u2013 1 n\u0103m/96 bu\u1ed5i','L\u1edbp 2-1 \u2013 1 n\u0103m/96 bu\u1ed5i','L\u1edbp 1-1 \u2013 1 n\u0103m/96 bu\u1ed5i'],
  'Guitar':                             ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Violin':                             ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Ukulele':                            ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Vẽ Mầm Non':                         ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ Căn Bản':                         ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ - Ký Họa / Màu Nước / Màu Marker':['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ - Màu Acrylic Canvas / Digital Art':['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Ballet (3-5 tuổi)':                  ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Ballet (6-9 tuổi)':                  ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Dance':                              ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Khiêu Vũ':                           ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Múa Cổ Trang':                       ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Thanh Nhạc':                         ['Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Luyện Thi - Piano':                  ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi'],
  'Luyện Thi - Guitar':                 ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi','Luyện 3-1 · 1 tháng/8 buổi','Luyện 2-1 · 1 tháng/8 buổi','Luyện 1-1 · 1 tháng/8 buổi'],
  'Luyện Thi - Violin':                 ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi'],
  'Luyện Thi - Vẽ':                     ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi'],
  'Cảm Thụ Âm Nhạc':                   ['Miễn Phí · 24 buổi'],
  'Piano Đệm Hát':                      ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Trống':                               ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
};

function populatePackages(selectedPkg) {
  const subj = document.getElementById('f-subject').value;
  const pkgSel = document.getElementById('f-package');
  const pkgs = COURSE_PACKAGES[subj] || [];
  pkgSel.innerHTML = pkgs.length
    ? '<option value="">-- Chọn gói --</option>' + pkgs.map(p => `<option${p===selectedPkg?' selected':''}>${p}</option>`).join('')
    : '<option value="">-- Chọn khóa học trước --</option>';
  // populate class dropdown
  const clSel = document.getElementById('f-classid');
  if (clSel) {
    const filtered = classes.filter(c => !subj || c.subject === subj);
    clSel.innerHTML = '<option value="">-- Chọn lớp (nếu có) --</option>'
      + filtered.map(c => `<option value="${c.id}">[${c.code}] ${c.name}</option>`).join('');
  }
}
function onClassSelect() {
  // tự động điền tên lớp nếu chọn
}

function setStudentClassFilter(f, el) {
  studentClassFilter = f;
  document.querySelectorAll('#filter-class-tabs .filter-tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderStudentTable();
}
function renderClassFilterBtns() {
  const wrap = document.getElementById('class-filter-btns');
  if (!wrap) return;
  const allActive = studentClassFilter==='all' ? ' active' : '';
  wrap.innerHTML = `<button class="filter-tab${allActive}" onclick="setStudentClassFilter('all',this)">Tất Cả</button>`
    + classes.map(c => `<button class="filter-tab${studentClassFilter===c.id?' active':''}" onclick="setStudentClassFilter('${c.id}',this)">[${c.code}] ${c.name}</button>`).join('');
}
function setStudentSubjectFilter(f, el) {
  studentSubjectFilter = f;
  document.querySelectorAll('#filter-subject-tabs .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderStudentTable();
}

function renderSubjectFilterBtns() {
  const wrap = document.getElementById('subject-filter-btns');
  if (!wrap) return;
  // Build full list: static + custom (dedup by name)
  const staticNames = new Set(STATIC_COURSES.map(c => c.name));
  const allTabs = [...STATIC_COURSES];
  customCourses.forEach(c => {
    if (!staticNames.has(c.name)) allTabs.push({name: c.name, emoji: c.emoji||'📚', match: c.name});
  });
  const allBtn = `<button class="filter-tab${studentSubjectFilter==='all'?' active':''}" onclick="setStudentSubjectFilter('all',this)">Tất Cả</button>`;
  const tabBtns = allTabs.map(c => {
    const active = (studentSubjectFilter === c.match || studentSubjectFilter === c.name) ? ' active' : '';
    return `<button class="filter-tab${active}" onclick="setStudentSubjectFilter('${c.match}',this)">${c.emoji} ${c.name}</button>`;
  }).join('');
  wrap.innerHTML = allBtn + tabBtns;
}

function closeCourse(){document.getElementById('course-modal').classList.remove('open');}
function closeCourseModal(e){if(e.target===document.getElementById('course-modal'))closeCourse();}

// ── STUDENTS ──
function saveStudent(){
  const g=id=>{const el=document.getElementById(id);return el?(el.value.trim?el.value.trim():el.value):'';};
  const name=g('f-name'),dob=g('f-dob'),parent=g('f-parent'),phone=g('f-phone'),
        subject=g('f-subject'),pkg=g('f-package'),totalSessions=Number(g('f-totalSessions'))||0,
        classid=Number(document.getElementById('f-classid')?document.getElementById('f-classid').value:'')||0,
        start=g('f-start'),end=g('f-end'), source=g('f-source'),
        payment=g('f-payment'),amount=g('f-amount'),paydate=g('f-paydate'),note=g('f-note');
  if(!name||!parent||!phone||!subject||!start||!payment){
    showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)',true);return;
  }
  const isEdit=editStudentId!==null;
  let finalVsId = isEdit ? (students.find(s=>s.id===editStudentId)||{}).vsId : null;
  if (!isEdit) {
    const maxHv = students.reduce((max, s) => Math.max(max, Number((s.vsId||'').replace('HV', '') || 0)), 0);
    finalVsId = `HV${String(maxHv + 1).padStart(4, '0')}`;
  }
  const obj={id:isEdit?editStudentId:Date.now(),vsId:finalVsId,name,dob,parent,phone,subject,pkg,
             totalSessions,classid,start,end,source,payment,amount:Number(amount)||0,paydate,note};
  if(isEdit){
    const i=students.findIndex(s=>s.id===editStudentId);
    if(i!==-1)students[i]=obj; else{showToast('Không tìm thấy học viên!',true);return;}
    editStudentId=null;
  } else students.push(obj);
  saveAsync().then(ok=>{
    if(ok){
      showToast(isEdit?'Đã cập nhật học viên thành công!':'Đã thêm học viên thành công!');
      if (!isEdit && typeof autoCreateStudentAccount === 'function') autoCreateStudentAccount(obj);
      const back=window._addStudentForClassId; clearStudentForm(); window._addStudentForClassId=null;
      if(!isEdit&&back) viewClassDetail(back); else showPage('students');
    } else { if(!isEdit) students.pop(); }
  });
}
function clearStudentForm(){
  ['f-name','f-dob','f-parent','f-phone','f-package','f-totalSessions','f-start','f-end','f-note','f-amount','f-paydate'].forEach(id=>document.getElementById(id).value='');
  ['f-subject','f-payment','f-source'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f-package').innerHTML='<option value="">-- Chọn khóa học trước --</option>';
  const clSel=document.getElementById('f-classid');if(clSel)clSel.innerHTML='<option value="">-- Chọn lớp (nếu có) --</option>';
  editStudentId=null; document.getElementById('form-title').innerHTML='Thêm <span>Học Viên</span>';
}
function editStudent(id){
  const s=students.find(x=>x.id===id); if(!s)return; editStudentId=id;
  document.getElementById('f-name').value=s.name;
  document.getElementById('f-dob').value=s.dob||'';
  document.getElementById('f-parent').value=s.parent;
  document.getElementById('f-phone').value=s.phone;
  document.getElementById('f-subject').value=s.subject;
  populatePackages(s.pkg||'');
  const clSel = document.getElementById('f-classid'); if(clSel && s.classid) { clSel.value = s.classid; }
  document.getElementById('f-start').value=s.start;
  const tsEl=document.getElementById('f-totalSessions'); if(tsEl) tsEl.value=s.totalSessions||'';
  document.getElementById('f-end').value=s.end||'';
  if(document.getElementById('f-source')) document.getElementById('f-source').value=s.source||'';
  document.getElementById('f-payment').value=s.payment;
  document.getElementById('f-amount').value=s.amount||'';
  document.getElementById('f-paydate').value=s.paydate||'';
  document.getElementById('f-note').value=s.note||'';
  document.getElementById('form-title').innerHTML='Chỉnh Sửa <span>Học Viên</span>';
  showPage('add-student');
}
function deleteStudent(id) {
  const s = students.find(x => x.id === id); if (!s) return;
  confirmDelete(s.name, () => {
    students = students.filter(x => x.id !== id);
    save(); renderStudentTable(); renderDashboard();
    showToast('Đã xóa học viên ' + s.name + '.');
  });
}
function setStudentFilter(f,el){
  studentFilter=f;
  document.querySelectorAll('#page-students .filter-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderStudentTable();
}

// Đếm buổi đã học của 1 học viên (từ điểm danh + bù lịch)
function countStudentSessions(studentId, classId) {
  let count = 0;
  attendance.forEach(a => {
    if (a.records && a.records[String(studentId)] === 'present') count++;
  });
  makeups.forEach(m => {
    if (String(m.studentId) === String(studentId) && m.status === 'done') count++;
  });
  return count;
}

function extractTotalSessions(pkg) {
  if (!pkg) return 0;
  const m = pkg.match(/(\d+)\s*buổi/);
  return m ? parseInt(m[1]) : 0;
}


function isExpiringSoon(s) {
  if (!s.end) return false;
  const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'}));
  const end = new Date(s.end);
  const d = Math.ceil((end - now) / (1000*60*60*24));
  return d >= 0 && d <= 14;
}
function renderExpiryBanner() {
  const el = document.getElementById('expiry-banner');
  if (!el) return;
  const exp = students.filter(s => isExpiringSoon(s) && s.subject !== 'Học Thử');
  if (!exp.length) { el.style.display='none'; return; }
  el.style.display='';
  el.innerHTML = '<span style="font-weight:700;color:#dc2626;">⏰ '
    + exp.length + ' học viên sắp hết khóa:</span> '
    + exp.map(s=>'<span style="font-weight:600">'+s.name+'</span>').join(', ');
}
function renderStudentTable(){
  renderClassFilterBtns();
  renderSubjectFilterBtns();
  renderExpiryBanner();
  const q=(document.getElementById('search-input').value||'').toLowerCase();
  const filtered=students.filter(s=>{
    const mq=!q||s.name.toLowerCase().includes(q)||s.phone.includes(q)||s.subject.toLowerCase().includes(q)||(s.parent&&s.parent.toLowerCase().includes(q));
    let mf=true;
    if(studentFilter==='hoc-thu') mf=s.subject==='Học Thử';
    else if(studentFilter==='sap-het-khoa') mf=isExpiringSoon(s)&&s.subject!=='Học Thử';
    else if(studentFilter!=='all') mf=s.payment===studentFilter;
    const mc=studentClassFilter==='all'||Number(s.classid)===Number(studentClassFilter);
    const ms=studentSubjectFilter==='all'||s.subject===studentSubjectFilter||(studentSubjectFilter==='Vẽ'&&s.subject&&s.subject.startsWith('Vẽ'))||(studentSubjectFilter==='Ballet'&&s.subject&&s.subject.startsWith('Ballet'))||(studentSubjectFilter==='Luyện Thi'&&s.subject&&s.subject.startsWith('Luyện Thi'));
    return mq&&mf&&ms&&mc;
  });
  const tbody=document.getElementById('student-table-body');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Không tìm thấy học viên nào</div></div></td></tr>`;return;}
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">✓ CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash">💵 TM</span>`:`<span class="badge badge-unpaid">⚠ Chưa TT</span>`;
  tbody.innerHTML=filtered.map((s,i)=>{
    const isHocThu = s.subject==='Học Thử';
    const expiring = isExpiringSoon(s)&&!isHocThu;
    const daysLeft = s.end ? Math.ceil((new Date(s.end)-new Date())/(1000*60*60*24)) : null;
    const expiryTag = expiring&&daysLeft!==null ? `<br><span style="font-size:10px;color:#dc2626;font-weight:700">⏰ còn ${daysLeft} ngày</span>` : '';
    const hocThuTag = isHocThu ? `<br><span style="font-size:10px;background:#fde047;color:#713f12;padding:1px 6px;border-radius:4px;font-weight:700">⭐ HỌC THỬ</span>` : '';
    const rowStyle = isHocThu?'background:linear-gradient(90deg,#fefce8,#fff);':expiring?'background:linear-gradient(90deg,#fff7ed,#fff);':'';
    // Tính buổi học
    const totalPkg = s.totalSessions || extractTotalSessions(s.pkg);
    const doneSessions = countStudentSessions(s.id, s.classid);
    const pct = totalPkg ? Math.min(100, Math.round(doneSessions/totalPkg*100)) : 0;
    const sessionColor = pct>=100?'#16a34a':pct>=60?'#d97706':'var(--navy)';
    const sessionCell = totalPkg
      ? `<div style="font-size:12px;font-weight:700;color:${sessionColor}">${doneSessions}/${totalPkg}</div>
         <div style="width:60px;height:5px;background:var(--cream2);border-radius:4px;margin-top:3px;overflow:hidden;">
           <div style="width:${pct}%;height:100%;background:${sessionColor};border-radius:4px;"></div>
         </div>`
      : `<span style="color:var(--muted);font-size:11px;">–</span>`;
    return `<tr style="${rowStyle}">
      <td style="text-align:center;font-size:11px;color:var(--muted);font-weight:600;">${i+1}</td>
      <td style="text-align:center"><span style="display:inline-block;background:var(--navy);color:var(--gold);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:800;white-space:nowrap;letter-spacing:.5px;min-width:52px;text-align:center;">${s.vsId||'–'}</span></td>
      <td class="td-name" style="font-weight:700;color:var(--navy)">${s.name}${hocThuTag}</td>
      <td>${fmtDate(s.dob)}</td>
      <td>${s.parent}</td>
      <td>${s.phone}</td>
      <td style="font-weight:600;color:var(--navy)">${s.subject}${s.pkg?`<br><span style="font-size:10px;color:var(--muted);font-weight:400">${s.pkg}</span>`:''}</td>
      <td>${(()=>{const cl=classes.find(c=>Number(c.id)===Number(s.classid));return cl?`<span class='pos-badge'>[${cl.code}]<br>${cl.name}</span>`:'–';})()}</td>
      <td style="font-size:11.5px">${fmtDate(s.start)}<br><span style="color:var(--muted)">→ ${fmtDate(s.end)}</span>${expiryTag}</td>
      <td>${pb(s.payment)}</td>
      <td style="font-weight:700;color:var(--gold)">${s.amount?fmt(s.amount):'–'}</td>
      <td style="text-align:center;">${sessionCell}</td>
      <td><div class="action-btns"><button class="btn-icon" onclick="if(typeof openStudentProfile==='function')openStudentProfile(${s.id})" title="Hồ Sơ HV" style="color:#3b82f6">👤</button><button class="btn-icon" onclick="if(typeof showPaymentHistory==='function')showPaymentHistory(${s.id})" title="Lịch Sử Thanh Toán" style="color:#22c55e">💳</button><button class="btn-icon" onclick="editStudent(${s.id})" title="Sửa">✎</button><button class="btn-icon" onclick="if(typeof showVietQR==='function')showVietQR(${s.id})" title="QR Thanh Toán" style="color:var(--gold)">⬡</button><button class="btn-icon" onclick="if(typeof openFeedbackModal==='function')openFeedbackModal(${s.id})" title="Nhận Xét GV" style="color:#22c55e">✍</button><button class="btn-icon del" onclick="deleteStudent(${s.id})" title="Xóa">✕</button></div></td>
    </tr>`;
  }).join('');
}

// ── STAFF ──
function saveStaff(){
  const g=id=>document.getElementById(id).value.trim?document.getElementById(id).value.trim():document.getElementById(id).value;
  const name=g('sf-name'),dob=g('sf-dob'),phone=g('sf-phone'),role=g('sf-role'),status=g('sf-status'),note=g('sf-note');
  if(!name||!phone||!role||!status){showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)',true);return;}
  let newStaffVsId = editStaffId ? (staff.find(s=>s.id===editStaffId)||{}).vsId : null;
  if (!newStaffVsId) {
    const maxNum = staff.reduce((max,s)=>{
      const m = s.vsId ? parseInt(s.vsId.replace('GV','')) : 0;
      return m > max ? m : max;
    }, 0);
    newStaffVsId = `GV${String(maxNum+1).padStart(4,'0')}`;
  }
  const obj={id:editStaffId||Date.now(),vsId:newStaffVsId,name,dob,phone,role,status,note};
  if(editStaffId!==null){const i=staff.findIndex(s=>s.id===editStaffId);if(i!==-1)staff[i]=obj;editStaffId=null;}
  else staff.push(obj);
  saveAsync().then(ok => {
    if (ok) { showToast('Đã lưu nhân sự thành công!'); clearStaffForm(); showPage('staff'); }
  });
}
function clearStaffForm(){
  ['sf-name','sf-dob','sf-phone','sf-note'].forEach(id=>document.getElementById(id).value='');
  ['sf-role','sf-status'].forEach(id=>document.getElementById(id).value='');
  editStaffId=null; document.getElementById('staff-form-title').innerHTML='Thêm <span>Nhân Sự</span>';
}
function editStaffMember(id){
  const s=staff.find(x=>x.id===id); if(!s)return; editStaffId=id;
  document.getElementById('sf-name').value=s.name;
  document.getElementById('sf-dob').value=s.dob||'';
  document.getElementById('sf-phone').value=s.phone;
  document.getElementById('sf-role').value=s.role;
  document.getElementById('sf-status').value=s.status;
  document.getElementById('sf-note').value=s.note||'';
  document.getElementById('staff-form-title').innerHTML='Chỉnh Sửa <span>Nhân Sự</span>';
  showPage('add-staff');
}
function deleteStaff(id) {
  const s = staff.find(x => x.id === id); if (!s) return;
  confirmDelete(s.name, () => {
    staff = staff.filter(x => x.id !== id);
    save(); renderStaffTable(); renderDashboard();
    showToast('Đã xóa nhân sự ' + s.name + '.');
  });
}
function setStaffFilter(f,el){staffFilter=f;document.querySelectorAll('#page-staff .filter-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderStaffTable();}

function renderStaffTable(){
  const q=(document.getElementById('staff-search').value||'').toLowerCase();
  const filtered=staff.filter(s=>{
    const mq=!q||s.name.toLowerCase().includes(q)||s.phone.includes(q)||s.role.toLowerCase().includes(q);
    let mf=true;
    if(staffFilter==='Giáo Viên') mf=s.role.startsWith('Giáo Viên');
    else if(staffFilter==='Nhân Viên') mf=!s.role.startsWith('Giáo Viên');
    else if(staffFilter!=='all') mf=s.status===staffFilter;
    return mq&&mf;
  });
  const tbody=document.getElementById('staff-table-body');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">Không tìm thấy nhân sự nào</div></div></td></tr>`;return;}
  tbody.innerHTML=filtered.map((s,i)=>`
    <tr>
      <td>${i+1}</td>
      <td style="font-weight:600;color:var(--navy);text-align:center;">${s.vsId||'—'}</td>
      <td class="td-name">${s.name}</td>
      <td>${fmtDate(s.dob)}</td>
      <td>${s.phone}</td>
      <td>${s.email||'—'}</td>
      <td>${s.bankName ? s.bankName + ' - ' + (s.bankAccount||'') : '—'}</td>
      <td><span class="pos-badge">${s.role}</span></td>
      <td>${s.status==='Đang hoạt động'?`<span class="badge badge-active">● Hoạt Động</span>`:`<span class="badge badge-offline">○ Offline</span>`}</td>
      <td><div class="action-btns"><button class="btn-icon" onclick="editStaffMember(${s.id})" title="Sửa">✎</button><button class="btn-icon del" onclick="deleteStaff(${s.id})" title="Xóa">✕</button></div></td>
    </tr>`).join('');
}

// ── LEADS ──
// Show/hide học thử fields based on status
function onLeadStatusChange() {
  const status = document.getElementById('lf-status').value;
  const isHocThu = status === 'Đăng ký học thử';
  ['lf-hocthu-wrap','lf-hocthu-fee-wrap','lf-dungcu-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isHocThu ? '' : 'none';
  });
  if (isHocThu && !document.getElementById('lf-dungcu-rows').children.length) {
    // keep empty, user can add
  }
}

function addDungcuRow(name='', price=0) {
  const wrap = document.getElementById('lf-dungcu-rows');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = `
    <input type="text" class="search-box dc-name" placeholder="Tên dụng cụ (VD: Sách Grade)" value="${name}" style="flex:2;padding:7px 10px;font-size:12px;" oninput="calcDungcuTotal()">
    <input type="number" class="search-box dc-price" placeholder="Giá (đ)" value="${price||''}" min="0" style="flex:1;padding:7px 10px;font-size:12px;" oninput="calcDungcuTotal()">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove();calcDungcuTotal();" title="Xóa">✕</button>`;
  wrap.appendChild(div);
  calcDungcuTotal();
}

function calcDungcuTotal() {
  let total = 0;
  document.querySelectorAll('#lf-dungcu-rows .dc-price').forEach(el => {
    total += Number(el.value) || 0;
  });
  const t = document.getElementById('lf-dungcu-total');
  if (t) t.textContent = total.toLocaleString('vi-VN') + ' đ';
}

function getDungcuItems() {
  const items = [];
  document.querySelectorAll('#lf-dungcu-rows > div').forEach(div => {
    const name = div.querySelector('.dc-name').value.trim();
    const price = Number(div.querySelector('.dc-price').value) || 0;
    if (name) items.push({ name, price });
  });
  return items;
}

function saveLead() {
  const g = id => document.getElementById(id).value.trim ? document.getElementById(id).value.trim() : document.getElementById(id).value;
  const name=g('lf-name'),dob=g('lf-dob'),parent=g('lf-parent'),phone=g('lf-phone'),
        course=g('lf-course'),source=g('lf-source'),status=g('lf-status'),note=g('lf-note');
  if (!name||!parent||!phone||!course||!source||!status) { showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', true); return; }
  const existing = editLeadId ? (leads.find(l => l.id === editLeadId) || {}) : {};
  // Học thử
  const hocThuTypeSel = document.getElementById('lf-hocthu-type');
  const hocThuFeeSel  = document.getElementById('lf-hocthu-fee');
  const hocThuType = hocThuTypeSel ? hocThuTypeSel.options[hocThuTypeSel.selectedIndex]?.text || '' : '';
  const hocThuFee  = hocThuFeeSel  ? Number(hocThuFeeSel.value) || 0 : 0;
  // Dụng cụ
  const dungcu = getDungcuItems();
  const dungcuTotal = dungcu.reduce((a,i) => a+i.price, 0);
  const totalThu = hocThuFee + dungcuTotal;
  const obj = { id: editLeadId || Date.now(), name, dob, parent, phone, course, source, status, note,
    hocThuType, hocThuFee, dungcu, dungcuTotal, totalThu,
    createdAt: existing.createdAt || new Date().toISOString().slice(0,10) };
  if (editLeadId !== null) {
    const i = leads.findIndex(l => l.id === editLeadId);
    if (i !== -1) leads[i] = obj;
    editLeadId = null;
  } else leads.push(obj);
  saveAsync().then(ok => {
    if (ok) { showToast('Đã lưu học viên tiềm năng!'); clearLeadForm(); showPage('leads'); }
  });
}

function clearLeadForm() {
  ['lf-name','lf-dob','lf-parent','lf-phone','lf-note'].forEach(id => document.getElementById(id).value = '');
  ['lf-course','lf-source','lf-status'].forEach(id => document.getElementById(id).value = '');
  const ht = document.getElementById('lf-hocthu-type'); if(ht) ht.value='';
  const hf = document.getElementById('lf-hocthu-fee'); if(hf) hf.value='';
  const dr = document.getElementById('lf-dungcu-rows'); if(dr) dr.innerHTML='';
  ['lf-hocthu-wrap','lf-hocthu-fee-wrap','lf-dungcu-wrap'].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display='none';
  });
  editLeadId = null;
  document.getElementById('lead-form-title').innerHTML = 'Thêm <span>HV Tiềm Năng</span>';
}

function editLead(id) {
  const l = leads.find(x => x.id === id); if (!l) return;
  editLeadId = id;
  document.getElementById('lf-name').value   = l.name;
  document.getElementById('lf-dob').value    = l.dob||'';
  document.getElementById('lf-parent').value = l.parent;
  document.getElementById('lf-phone').value  = l.phone;
  document.getElementById('lf-course').value = l.course;
  document.getElementById('lf-source').value = l.source;
  document.getElementById('lf-status').value = l.status;
  document.getElementById('lf-note').value   = l.note||'';
  // Restore học thử
  onLeadStatusChange();
  const ht = document.getElementById('lf-hocthu-type'); if(ht && l.hocThuFee) ht.value = l.hocThuFee;
  const hf = document.getElementById('lf-hocthu-fee'); if(hf) hf.value = l.hocThuFee||'';
  // Restore dụng cụ
  const dr = document.getElementById('lf-dungcu-rows'); if(dr) dr.innerHTML='';
  (l.dungcu||[]).forEach(dc => addDungcuRow(dc.name, dc.price));
  document.getElementById('lead-form-title').innerHTML = 'Chỉnh Sửa <span>HV Tiềm Năng</span>';
  showPage('add-lead');
}

function deleteLead(id) {
  const l = leads.find(x => x.id === id); if (!l) return;
  confirmDelete(l.name, () => {
    leads = leads.filter(x => x.id !== id);
    save(); renderLeadTable(); renderDashboard();
    showToast('Đã xóa học viên tiềm năng ' + l.name + '.');
  });
}

function setLeadFilter(f, el) {
  leadFilter = f;
  document.querySelectorAll('#page-leads .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderLeadTable();
}

function renderLeadTable() {
  const q = (document.getElementById('lead-search').value || '').toLowerCase();
  const filtered = leads.filter(l => {
    const mq = !q || l.name.toLowerCase().includes(q) || (l.phone||'').includes(q) || (l.course||'').toLowerCase().includes(q) || (l.parent||'').toLowerCase().includes(q);
    const mf = leadFilter === 'all' || l.status === leadFilter || l.source === leadFilter;
    return mq && mf;
  });
  const tbody = document.getElementById('lead-table-body');
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">Không tìm thấy học viên tiềm năng nào</div></div></td></tr>`; return; }
  const srcBadge = s => {
    if (s === 'Facebook') return `<span class="badge badge-src-fb">📘 FB</span>`;
    if (s === 'Tiktok')   return `<span class="badge badge-src-tt">🎵 TT</span>`;
    return `<span class="badge badge-src-direct">🏠 TT</span>`;
  };
  const stBadge = s => {
    if (s === 'Đã tư vấn')        return `<span class="badge badge-consulted">✓ Đã TV</span>`;
    if (s === 'Đăng ký học thử')  return `<span class="badge" style="background:#fef9c3;color:#713f12;border:1.5px solid #fcd34d;">⭐ HT</span>`;
    if (s === 'Đã đăng ký học')   return `<span class="badge" style="background:#dcfce7;color:#15803d;border:1.5px solid #4ade80;">✅ ĐK</span>`;
    return `<span class="badge badge-new">○ Chưa LH</span>`;
  };
  tbody.innerHTML = filtered.map((l, i) => {
    const hocThuFmt = l.hocThuFee ? `<div style="font-size:11px;color:var(--navy);font-weight:600;">${l.hocThuType||'Học thử'}</div><div style="font-size:11px;color:var(--gold);font-weight:700;">${Number(l.hocThuFee).toLocaleString('vi-VN')} đ</div>` : '–';
    const dungcuFmt = (l.dungcu||[]).length
      ? `<div style="font-size:10.5px;color:var(--navy);">${l.dungcu.map(d=>`${d.name}: ${Number(d.price).toLocaleString('vi-VN')}đ`).join('<br>')}</div>`
      : '–';
    const totalFmt = (l.totalThu||0) > 0 ? `<span style="font-weight:800;color:var(--gold);">${Number(l.totalThu).toLocaleString('vi-VN')} đ</span>` : '–';
    return `<tr>
      <td>${i+1}</td>
      <td class="td-name">${l.name}</td>
      <td>${fmtDate(l.dob)}</td>
      <td>${l.parent}</td>
      <td>${l.phone}</td>
      <td style="font-weight:600;color:var(--navy)">${l.course}</td>
      <td>${srcBadge(l.source)}</td>
      <td>${stBadge(l.status)}</td>
      <td style="font-size:11px;color:var(--muted);max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${l.note||''}">${l.note||'–'}</td>
      <td>${hocThuFmt}</td>
      <td>${dungcuFmt}</td>
      <td>${totalFmt}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="editLead(${l.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteLead(${l.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── REVENUE ──
function initRevSelectors(){
  const mSel=document.getElementById('rev-month');
  const ySel=document.getElementById('rev-year');
  const months=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  if(!mSel.options.length){
    months.forEach((m,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=m;mSel.appendChild(o);});
    const curY=new Date().getFullYear();
    for(let y=curY-2;y<=curY+1;y++){const o=document.createElement('option');o.value=y;o.textContent=y;ySel.appendChild(o);}
  }
  const now=new Date();
  mSel.value=now.getMonth()+1;
  ySel.value=now.getFullYear();
}
function setRevToday(){const now=new Date();document.getElementById('rev-month').value=now.getMonth()+1;document.getElementById('rev-year').value=now.getFullYear();renderRevenue();}

function renderRevenue(){
  const m=parseInt(document.getElementById('rev-month').value);
  const y=parseInt(document.getElementById('rev-year').value);
  const paid=students.filter(s=>{
    if(!s.paydate||s.payment==='Chưa Thanh Toán')return false;
    const d=new Date(s.paydate);
    return d.getFullYear()===y&&(d.getMonth()+1)===m;
  });
  const unpaidMonth=students.filter(s=>{
    if(s.payment!=='Chưa Thanh Toán')return false;
    const d=new Date(s.start);
    return d.getFullYear()===y&&(d.getMonth()+1)===m;
  });
  // Thu từ leads (học thử + dụng cụ) trong tháng
  const paidLeads = leads.filter(l => {
    if (!l.totalThu || l.totalThu <= 0) return false;
    const d = new Date(l.createdAt||'');
    return d.getFullYear()===y && (d.getMonth()+1)===m;
  });
  const leadRevenue = paidLeads.reduce((a,l) => a + Number(l.totalThu||0), 0);

  const studentTotal = paid.reduce((a,s)=>a+Number(s.amount||0),0);
  const total = studentTotal + leadRevenue;

  document.getElementById('rev-total-value').textContent=fmt(total);
  document.getElementById('rev-total-count').textContent=paid.length + paidLeads.length;
  document.getElementById('rev-unpaid-count').textContent=unpaidMonth.length;

  const breakdown={};
  paid.forEach(s=>{
    const key=s.subject||'Khác';
    if(!breakdown[key])breakdown[key]={total:0,count:0};
    breakdown[key].total+=Number(s.amount||0);
    breakdown[key].count++;
  });
  if (leadRevenue > 0) {
    breakdown['Học Thử & Dụng Cụ'] = { total: leadRevenue, count: paidLeads.length };
  }
  const bEl=document.getElementById('rev-breakdown');
  const entries=Object.entries(breakdown).sort((a,b)=>b[1].total-a[1].total);
  bEl.innerHTML=entries.length?entries.map(([k,v])=>`
    <div class="rev-cat">
      <div class="rev-cat-name">${k}</div>
      <div class="rev-cat-amount">${fmt(v.total)}</div>
      <div class="rev-cat-count">${v.count} khoản</div>
    </div>`).join(''):'<p style="color:var(--muted);font-size:13px;padding:12px 0;">Không có dữ liệu trong tháng này.</p>';

  const tbody=document.getElementById('rev-table-body');
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">✓ CK</span>`:`<span class="badge badge-cash">💵 TM</span>`;
  const allRows = [
    ...paid.map((s,i)=>`<tr>
      <td>${i+1}</td>
      <td class="td-name">${s.name}</td>
      <td style="color:var(--navy);font-weight:600">${s.subject}</td>
      <td style="font-size:11px;color:var(--muted)">${s.pkg||'–'}</td>
      <td style="font-weight:800;color:var(--gold)">${fmt(s.amount)}</td>
      <td>${fmtDate(s.paydate)}</td>
      <td>${pb(s.payment)}</td>
    </tr>`),
    ...paidLeads.map((l,i)=>`<tr style="background:#fefce8;">
      <td>${paid.length+i+1}</td>
      <td class="td-name">${l.name}</td>
      <td style="color:var(--navy);font-weight:600">${l.hocThuType||'Học Thử/Dụng Cụ'}</td>
      <td style="font-size:11px;color:var(--muted)">${(l.dungcu||[]).map(d=>d.name).join(', ')||'–'}</td>
      <td style="font-weight:800;color:var(--gold)">${fmt(l.totalThu)}</td>
      <td>${fmtDate(l.createdAt)}</td>
      <td><span class="badge badge-cash">💵 Mục Khác</span></td>
    </tr>`),
  ];
  if(!allRows.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Chưa có khoản thu nào trong tháng này</div></div></td></tr>`;return;}
  tbody.innerHTML = allRows.join('');
}

// ── DASHBOARD ──
function renderDashboard(){
  document.getElementById('stat-total').textContent   = students.length;
  document.getElementById('stat-paid').textContent    = students.filter(s=>s.payment!=='Chưa Thanh Toán').length;
  document.getElementById('stat-unpaid').textContent  = students.filter(s=>s.payment==='Chưa Thanh Toán').length;
  document.getElementById('stat-staff').textContent   = staff.length;
  document.getElementById('stat-leads').textContent   = leads.length;
  const recent=[...students].reverse().slice(0,5);
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid" style="font-size:10px">✓ CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash" style="font-size:10px">TM</span>`:`<span class="badge badge-unpaid" style="font-size:10px">Chưa</span>`;
  const dtEl=document.getElementById('dashboard-table');
  dtEl.innerHTML=recent.length?recent.map(s=>`<tr><td class="td-name">${s.name}</td><td style="font-size:11.5px">${s.subject}</td><td>${pb(s.payment)}</td></tr>`).join(''):`<tr><td colspan="3"><div class="empty-state" style="padding:20px"><div class="empty-text">Chưa có học viên nào</div></div></td></tr>`;
  const now=new Date();
  const m=now.getMonth()+1,y=now.getFullYear();
  const paidM=students.filter(s=>{if(!s.paydate||s.payment==='Chưa Thanh Toán')return false;const d=new Date(s.paydate);return d.getFullYear()===y&&(d.getMonth()+1)===m;});
  const totalM=paidM.reduce((a,s)=>a+Number(s.amount||0),0);
  const expM = (typeof expenses !== 'undefined' ? expenses : []).filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  });
  const totalExpM = expM.reduce((a,e) => a + Number(e.amount||0), 0);
  
  const drs = document.getElementById('dash-revenue-summary'); if(drs) drs.innerHTML=`
    <div style="text-align:center;padding:20px 0;display:flex;justify-content:space-between;align-items:center;">
      <div style="flex:1;border-right:1px solid #eee;">
        <div style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;">TỔNG THU (${m}/${y})</div>
        <div style="font-size:24px;font-weight:800;color:var(--gold);letter-spacing:-1px">${fmt(totalM)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-weight:400;">từ ${paidM.length} học viên</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;">TỔNG CHI (${m}/${y})</div>
        <div style="font-size:24px;font-weight:800;color:#D94F4F;letter-spacing:-1px">${fmt(totalExpM)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-weight:400;">từ ${expM.length} khoản chi</div>
      </div>
    </div>`;
}

// ── XUẤT EXCEL ──
function exportExcel(type) {
  // Thử gọi server trước; nếu không có server thì xuất CSV trực tiếp từ browser
  const serverUrl = `/api/export/${type}`;

  fetch(serverUrl, { method: 'GET' })
    .then(res => {
      if (!res.ok) throw new Error('Server lỗi');
      return res.blob();
    })
    .then(blob => {
      const names = { students: 'HocVien', staff: 'NhanSu', leads: 'HVTiemNang', revenue: 'DoanhThu' };
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${names[type]}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất file Excel thành công!');
    })
    .catch(() => {
      // Fallback: xuất thẳng từ dữ liệu localStorage
      exportCSVLocal(type);
    });
}

function exportCSVLocal(type) {
  const BOM = '\uFEFF';
  const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '';
  const fmtNum  = n => Number(n || 0).toLocaleString('vi-VN');
  const q = v  => `"${String(v || '').replace(/"/g, '""')}"`;

  let csv = BOM;
  let filename = '';

  if (type === 'students') {
    filename = `HocVien_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Ngày Sinh','Phụ Huynh (Zalo)','SĐT','Môn Học','Gói / Lớp','Ngày BĐ','Ngày KT','Học Phí','Số Tiền (đ)','Ngày Nộp','Ghi Chú'].map(q).join(',') + '\n';
    students.forEach((s, i) => {
      csv += [i+1,s.name,fmtDate(s.dob),s.parent,s.phone,s.subject,s.pkg||'',fmtDate(s.start),fmtDate(s.end),s.payment,fmtNum(s.amount),fmtDate(s.paydate),s.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'staff') {
    filename = `NhanSu_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Ngày Sinh','SĐT','Vị Trí','Tình Trạng','Ghi Chú'].map(q).join(',') + '\n';
    staff.forEach((s, i) => {
      csv += [i+1,s.name,fmtDate(s.dob),s.phone,s.role,s.status,s.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'leads') {
    filename = `HVTiemNang_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên HV','Ngày Sinh','Phụ Huynh (Zalo)','SĐT','Khóa Học','Nguồn Data','Tình Trạng','Ghi Chú'].map(q).join(',') + '\n';
    leads.forEach((l, i) => {
      csv += [i+1,l.name,fmtDate(l.dob),l.parent,l.phone,l.course,l.source,l.status,l.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'revenue') {
    filename = `DoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Môn Học','Gói / Lớp','Hình Thức','Số Tiền (đ)','Ngày Nộp'].map(q).join(',') + '\n';
    const paid = students.filter(s => s.payment !== 'Chưa Thanh Toán' && s.amount);
    paid.forEach((s, i) => {
      csv += [i+1,s.name,s.subject,s.pkg||'',s.payment,fmtNum(s.amount),fmtDate(s.paydate)].map(q).join(',') + '\n';
    });
    const total = paid.reduce((a, s) => a + Number(s.amount || 0), 0);
    csv += ['','','','',q('TỔNG'),q(fmtNum(total)),q('')].join(',') + '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất file Excel thành công!');
}


function showToast(msg,err){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.style.borderLeftColor=err?'var(--red)':'var(--gold)';
  t.className='toast show';
  setTimeout(()=>t.className='toast',3200);
}


// ── CLASSES ──
let editClassId = null;
const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];

function addScheduleRow(day, timeStart, timeEnd) {
  const list = document.getElementById('cl-schedule-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = `
    <select class="rev-month-select cl-day" style="flex:1">
      ${DAYS.map(d=>`<option${d===(day||'')?' selected':''}>${d}</option>`).join('')}
    </select>
    <input type="time" class="search-box cl-time-start" value="${timeStart||''}" style="flex:1;padding:8px 10px;" placeholder="Giờ bắt đầu" onchange="const dur = parseInt(document.getElementById('cl-duration')?.value || (document.getElementById('cl-subject')?.value?.toLowerCase().match(/vẽ|cảm thụ âm nhạc/) ? 90 : 60)); if(this.value && !this.nextElementSibling.value){ const [h,m]=this.value.split(':').map(Number); const d=new Date(); d.setHours(h,m+dur,0); this.nextElementSibling.value=d.toTimeString().slice(0,5); }">
    <input type="time" class="search-box cl-time-end" value="${timeEnd||''}" style="flex:1;padding:8px 10px;" placeholder="Giờ kết thúc">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove()" title="Xóa">✕</button>`;
  list.appendChild(div);
}

function getScheduleRows() {
  const rows = [];
  document.querySelectorAll('#cl-schedule-list > div').forEach(div => {
    const day   = div.querySelector('.cl-day').value;
    const start = div.querySelector('.cl-time-start').value;
    const end   = div.querySelector('.cl-time-end').value;
    if (day) rows.push({day, start, end});
  });
  return rows;
}

function saveClass() {
  const g = id => document.getElementById(id).value.trim();
  const code = g('cl-code'), name = g('cl-name'), subject = g('cl-subject'),
        teacher = g('cl-teacher'), room = g('cl-room'), note = g('cl-note');
  if (!code || !name || !subject) { showToast('Vui lòng điền Mã Lớp, Tên Lớp và Khóa Học (*)', true); return; }
  if (classes.find(c => c.code === code && c.id !== editClassId)) { showToast('Mã lớp đã tồn tại!', true); return; }
  const schedule = getScheduleRows();
  if (typeof window.checkScheduleConflict === 'function') {
      const conflictMsg = window.checkScheduleConflict(teacher, schedule, editClassId);
      if (conflictMsg) {
          if (!confirm('CẢNH BÁO TRÙNG LỊCH: ' + conflictMsg + '\\nBạn có CHẮC CHẮN muốn lưu?')) return;
      }
  }
  // Auto-sync teacher to staff
    if (teacher) {
      const existing = staff.find(s => s.name.toLowerCase() === teacher.toLowerCase());
      if (!existing) {
        const nextId = Date.now() + Math.floor(Math.random() * 1000);
        const newVsId = 'GV' + String(staff.length + 1).padStart(4, '0');
        const newStaff = { id: nextId, vsId: newVsId, name: teacher, dob: '', phone: '', role: 'Giáo Viên', status: 'Hoạt Động', note: 'Tự động tạo từ TKB' };
        staff.push(newStaff);
        autoCreateStaffAccount(newStaff);
      }
    }

    const isNew=editClassId===null;
  const obj={id:isNew?Date.now():editClassId,code,name,subject,teacher,room,duration:document.getElementById('cl-duration')?document.getElementById('cl-duration').value:60,note,schedule};
  if(!isNew){const i=classes.findIndex(c=>c.id===editClassId);if(i!==-1)classes[i]=obj;else{showToast('Không tìm thấy lớp!',true);return;}}
  else classes.push(obj);

  editClassId=null; const savedId=obj.id;
  saveAsync().then(ok=>{
    if(ok){
      if(isNew){showToast('Đã tạo lớp thành công!');viewClassDetail(savedId);}
      else{showToast('Đã cập nhật lớp thành công!');showPage('classes');}
    } else { if(isNew) classes.pop(); }
  });
}

function populateTeacherDropdown() { const sel = document.getElementById("cl-teacher"); if(!sel) return; const currentVal = sel.value; sel.innerHTML = '<option value="">-- Chọn giáo viên --</option>' + staff.map(s => `<option value="${s.name}">${s.name} - ${s.role}</option>`).join(''); sel.value = currentVal; }

function clearClassForm() {
  ['cl-code','cl-name','cl-teacher','cl-room','cl-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value = ''; });
  if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 60;
  populateTeacherDropdown();
  document.getElementById('cl-subject').value = '';
  document.getElementById('cl-schedule-list').innerHTML = '';
  editClassId = null;
  document.getElementById('class-form-title').innerHTML = 'Thêm <span>Lớp Học</span>';
}

window.autoFillDuration = function() {
  const subj = document.getElementById('cl-subject')?.value?.toLowerCase() || '';
  if (subj.includes('vẽ') || subj.includes('cảm thụ âm nhạc')) {
    if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 90;
  } else {
    if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 60;
  }
};

function editClass(id) {
  const c = classes.find(x => x.id === id); if (!c) return;
  editClassId = id;
  document.getElementById('cl-code').value    = c.code;
  document.getElementById('cl-name').value    = c.name;
  document.getElementById('cl-subject').value = c.subject;
  populateTeacherDropdown();
  document.getElementById('cl-teacher').value = c.teacher || '';
  document.getElementById('cl-room').value    = c.room || '';
  if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = c.duration || 60;
  document.getElementById('cl-note').value    = c.note || '';
  document.getElementById('cl-schedule-list').innerHTML = '';
  (c.schedule || []).forEach(s => addScheduleRow(s.day, s.start, s.end));
  document.getElementById('class-form-title').innerHTML = 'Chỉnh Sửa <span>Lớp Học</span>';
  showPage('add-class');
}

function deleteClass(id) {
  const c = classes.find(x => x.id === id); if (!c) return;
  confirmDelete(c.name, () => {
    classes = classes.filter(x => x.id !== id);
    save(); renderClassTable(); renderDashboard();
    showToast('Đã xóa lớp ' + c.name + '.');
  });
}

function renderClassTable() {
  const q = (document.getElementById('class-search').value || '').toLowerCase();
  const filtered = classes.filter(c =>
    !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('class-table-body');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-text">Chưa có lớp nào</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((c, i) => {
    const hvCount = students.filter(s => Number(s.classid) === Number(c.id)).length;
    const sched = (c.schedule || []).map(s => `${s.day} ${s.start}–${s.end}`).join('<br>') || '–';
    return `<tr>
      <td>${i+1}</td>
      <td><span class="pos-badge">${c.code}</span></td>
      <td class="td-name">${c.name}</td>
      <td style="color:var(--navy);font-weight:600">${c.subject}</td>
      <td style="font-size:11.5px">${c.teacher||'–'}</td>
      <td style="font-size:11px;color:var(--muted)">${sched}</td>
      <td style="font-size:11.5px">${c.room||'–'}</td>
      <td style="font-weight:700;color:var(--navy)">${hvCount}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="viewClassDetail(${c.id})" title="Xem">👁</button>
        <button class="btn-icon" onclick="editClass(${c.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteClass(${c.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── SCHEDULE / TKB ──
let _tkbMode = 'simple'; // 'simple' | 'full'

function switchTKBTab(mode) {
  _tkbMode = mode;
  const s = document.getElementById('tkb-tab-simple');
  const f = document.getElementById('tkb-tab-full');
  if (s && f) {
    s.style.background = mode === 'simple' ? 'var(--gold)' : 'var(--cream2)';
    s.style.color      = mode === 'simple' ? '#1a1a1a' : 'var(--navy)';
    f.style.background = mode === 'full'   ? 'var(--gold)' : 'var(--cream2)';
    f.style.color      = mode === 'full'   ? '#1a1a1a' : 'var(--navy)';
  }
  renderSchedule();
}

function renderSchedule() {
  const filterSubj = document.getElementById('tkb-filter-subject')?.value || 'all';
  const filteredClasses = filterSubj === 'all' ? classes : classes.filter(c => c.subject === filterSubj);
  const dayOrder = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
  const grid = document.getElementById('schedule-grid');

  const slots = new Set();
  filteredClasses.forEach(c => (c.schedule||[]).forEach(s => { if (s.start) slots.add(s.start); }));
  const sortedSlots = [...slots].sort();

  if (!filteredClasses.length || !sortedSlots.length) {
    grid.innerHTML = '<div class="empty-state" style="padding:60px 0"><div class="empty-icon">📅</div><div class="empty-text">Chưa có lịch học nào.</div></div>';
    return;
  }

  const lookup = {};
  dayOrder.forEach(d => { lookup[d] = {}; });
  filteredClasses.forEach(c => {
    const classStudents = students.filter(s => Number(s.classid) === Number(c.id));
    (c.schedule||[]).forEach(s => {
      if (!s.day || !s.start) return;
      if (!lookup[s.day]) lookup[s.day] = {};
      if (!lookup[s.day][s.start]) lookup[s.day][s.start] = [];
      lookup[s.day][s.start].push({ cls: c, studs: classStudents, end: s.end });
    });
  });

  const isSimple = _tkbMode === 'simple';

  let html = `<div class="table-wrap"><table style="min-width:900px;border-collapse:collapse;">
    <thead><tr>
      <th style="width:80px;background:var(--navy);color:#fff;padding:10px 8px;font-size:12px;">Giờ</th>
      ${dayOrder.map(d => `<th style="background:var(--navy);color:#fff;padding:10px 8px;font-size:12px;">${d}</th>`).join('')}
    </tr></thead>
    <tbody>`;

  sortedSlots.forEach((slot, ri) => {
    const rowBg = ri % 2 === 0 ? '#fff' : '#fafafa';
    html += `<tr style="background:${rowBg}">`;
    html += `<td style="text-align:center;font-weight:800;font-size:13px;color:var(--navy);padding:8px 4px;border:1px solid #eee;white-space:nowrap;">${slot}</td>`;
    dayOrder.forEach(day => {
      const entries = (lookup[day]?.[slot]) || [];
      if (!entries.length) {
        html += `<td style="border:1px solid #eee;background:${rowBg}"></td>`;
      } else {
        html += `<td style="border:1px solid #eee;padding:4px;vertical-align:top;">`;
        entries.forEach(e => {
          const endStr = e.end ? `–${e.end}` : '';
          const subjectColor = {
            'Piano':'#3b82f6','Guitar':'#22c55e','Violin':'#a855f7','Dance':'#ef4444',
            'Ballet (3-5 tuổi)':'#ec4899','Ballet (6-9 tuổi)':'#f97316',
            'Vẽ Mầm Non':'#eab308','Vẽ Căn Bản':'#84cc16'
          }[e.cls.subject] || 'var(--navy)';

          if (isSimple) {
            // Dạng gọn: tên lớp + giờ + GV
            html += `<div style="background:${subjectColor}18;border-left:3px solid ${subjectColor};
              border-radius:0 6px 6px 0;padding:6px 8px;margin-bottom:4px;">
              <div style="font-weight:800;font-size:12px;color:${subjectColor};">${e.cls.name}</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">
                🕐 ${slot}${endStr}
              </div>
              ${e.cls.teacher ? `<div style="font-size:11px;color:#666;margin-top:1px;">👩‍🏫 ${e.cls.teacher}</div>` : ''}
              <div style="font-size:10px;color:#999;margin-top:1px;">${e.cls.subject} · ${e.studs.length} HV</div>
            </div>`;
          } else {
            // Dạng đầy đủ: + danh sách học viên
            const studsHtml = e.studs.length
              ? `<div style="margin-top:4px;border-top:1px dashed #eee;padding-top:4px;">
                  ${e.studs.map(s => `<div style="font-size:10px;color:#444;padding:1px 0;">• ${s.name}</div>`).join('')}
                 </div>`
              : `<div style="font-size:10px;color:#aaa;margin-top:3px;font-style:italic;">Chưa có HV</div>`;
            html += `<div style="background:${subjectColor}18;border-left:3px solid ${subjectColor};
              border-radius:0 6px 6px 0;padding:6px 8px;margin-bottom:4px;">
              <div style="font-weight:800;font-size:12px;color:${subjectColor};">${e.cls.name}</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">🕐 ${slot}${endStr}</div>
              ${e.cls.teacher ? `<div style="font-size:11px;color:#666;margin-top:1px;">👩‍🏫 ${e.cls.teacher}</div>` : ''}
              <div style="font-size:10px;color:#888;margin-top:1px;">${e.cls.subject}</div>
              ${studsHtml}
            </div>`;
          }
        });
        html += `</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  grid.innerHTML = html;
}


// ── CUSTOM COURSES CRUD ──
let editCustomCourseKey = null;

function startAddCourse() {
  editCustomCourseKey = null;
  document.getElementById('cc-key').value = '';
  document.getElementById('cc-name').value = '';
  document.getElementById('cc-emoji').value = '';
  document.getElementById('cc-rows-wrap').innerHTML = '';
  addCustomCourseRow();
  document.getElementById('custom-course-modal').classList.add('open');
}

function editCustomCourse(key) {
  const c = customCourses.find(x => x.key === key);
  if (!c) return;
  editCustomCourseKey = key;
  document.getElementById('cc-key').value = key;
  document.getElementById('cc-name').value = c.name;
  document.getElementById('cc-emoji').value = c.emoji || '';
  const wrap = document.getElementById('cc-rows-wrap');
  wrap.innerHTML = '';
  (c.sections||[]).forEach(sec => {
    (sec.rows||[]).forEach(r => addCustomCourseRow(sec.title, r.desc, r.amount));
  });
  document.getElementById('custom-course-modal').classList.add('open');
}

function deleteCustomCourse(key) {
  const c = customCourses.find(x => x.key === key);
  if (!c) return;
  confirmDelete(c.name, () => {
    customCourses = customCourses.filter(x => x.key !== key);
    if (customPrices[key]) delete customPrices[key];
    save(); renderCoursesPage(); showToast('Đã xóa khóa học ' + c.name);
  });
}

function addCustomCourseRow(section, desc, amount) {
  const wrap = document.getElementById('cc-rows-wrap');
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:1fr 2fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px;';
  div.innerHTML = `
    <input type="text" class="search-box cc-section" placeholder="Tên nhóm gói" value="${section||''}" style="padding:8px 10px;font-size:12px;">
    <input type="text" class="search-box cc-desc" placeholder="Mô tả gói học" value="${desc||''}" style="padding:8px 10px;font-size:12px;">
    <input type="number" class="search-box cc-amount" placeholder="Học phí (đ)" value="${amount||0}" min="0" style="padding:8px 10px;font-size:12px;">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove()" title="Xóa">✕</button>`;
  wrap.appendChild(div);
}

function saveCustomCourse() {
  const key = document.getElementById('cc-key').value.trim().replace(/\s+/g,'_').toLowerCase();
  const name = document.getElementById('cc-name').value.trim();
  const emoji = document.getElementById('cc-emoji').value.trim() || '📚';
  if (!key || !name) { showToast('Vui lòng điền Mã khóa và Tên khóa học!', true); return; }
  if (!editCustomCourseKey && (CD[key] || customCourses.find(c=>c.key===key))) {
    showToast('Mã khóa học đã tồn tại!', true); return;
  }
  // Build sections from rows
  const rows = document.querySelectorAll('#cc-rows-wrap > div');
  const sectMap = {};
  rows.forEach(div => {
    const sec = div.querySelector('.cc-section').value.trim() || 'Học Phí';
    const desc = div.querySelector('.cc-desc').value.trim();
    const amount = Number(div.querySelector('.cc-amount').value) || 0;
    if (!desc) return;
    if (!sectMap[sec]) sectMap[sec] = [];
    sectMap[sec].push({desc, amount});
  });
  const sections = Object.entries(sectMap).map(([title, rows]) => ({title, rows}));
  if (!sections.length) { showToast('Vui lòng thêm ít nhất 1 gói học phí!', true); return; }
  const obj = {key, name, emoji, sections};
  // packages
  const pkgList = [];
  sections.forEach(s => s.rows.forEach(r => pkgList.push(r.desc)));
  if (editCustomCourseKey) {
    const i = customCourses.findIndex(c => c.key === editCustomCourseKey);
    if (i !== -1) customCourses[i] = obj;
  } else {
    customCourses.push(obj);
  }
  // update COURSE_PACKAGES dynamically
  COURSE_PACKAGES[name] = pkgList;
  save(); closeCustomCourseModal(); renderCoursesPage();
  showToast('Đã lưu khóa học ' + name + '!');
}

function closeCustomCourseModal() {
  document.getElementById('custom-course-modal').classList.remove('open');
  editCustomCourseKey = null;
}

function renderCoursesPage() {
  renderSubjectFilterBtns();
  // Re-render course cards including custom ones
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  // static cards are already in HTML, just append/re-render custom ones
  let customHtml = '';
  customCourses.forEach(c => {
    const totalPkg = c.sections ? c.sections.reduce((a,s)=>a+s.rows.length,0) : 0;
    customHtml += `<div class="course-card" onclick="openCourse('${c.key}')">
      <span class="course-emoji">${c.emoji||'📚'}</span>
      <div class="course-name">${c.name}</div>
      <div class="course-count">${totalPkg} gói học phí</div>
      <div style="display:flex;gap:5px;margin-top:8px;">
        <button class="btn-icon" onclick="event.stopPropagation();editCustomCourse('${c.key}')" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="event.stopPropagation();deleteCustomCourse('${c.key}')" title="Xóa">✕</button>
      </div>
    </div>`;
  });
  document.getElementById('custom-courses-container').innerHTML = customHtml;
  // Sync COURSE_PACKAGES for all custom
  customCourses.forEach(c => {
    const pkgList = [];
    (c.sections||[]).forEach(s => s.rows.forEach(r => pkgList.push(r.desc)));
    COURSE_PACKAGES[c.name] = pkgList;
  });
  // Sync f-subject selects
  syncCourseSelects();
}

function syncCourseSelects() {
  ['f-subject','cl-subject','lf-course','tkb-filter-subject'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    [...sel.querySelectorAll('option.custom-opt')].forEach(o => o.remove());
    customCourses.forEach(c => {
      const o = document.createElement('option');
      o.textContent = c.name;
      o.className = 'custom-opt';
      sel.appendChild(o);
    });
  });
}

// ── INIT (gọi sau khi đăng nhập xong) ──
initRevSelectors();

// ════════════════════════════════════════
// ── ĐIỂM DANH ──
// ════════════════════════════════════════
function initAttendancePage() {
  // Populate class dropdown
  const sel = document.getElementById('att-class');
  sel.innerHTML = '<option value="">-- Chọn lớp --</option>'
    + classes.map(c => `<option value="${c.id}">[${c.code}] ${c.name} – ${c.subject}</option>`).join('');
  // Default date = today
  const d = document.getElementById('att-date');
  if (!d.value) d.value = new Date().toISOString().slice(0,10);
  document.getElementById('att-content').innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">Chọn lớp và ngày rồi nhấn "Tải Danh Sách"</div></div>`;
}

function loadAttStudents() {
  const classId = document.getElementById('att-class').value;
  const date    = document.getElementById('att-date').value;
  const session = document.getElementById('att-session').value;
  if (!classId || !date) { showToast('Vui lòng chọn lớp và ngày học', true); return; }

  const cls = classes.find(c => String(c.id) === String(classId));
  const classStudents = students.filter(s => String(s.classid) === String(classId));
  if (!classStudents.length) {
    document.getElementById('att-content').innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">Lớp này chưa có học viên nào</div></div>`;
    return;
  }

  // Find existing attendance record for this class+date
  const existing = attendance.find(a => String(a.classId) === String(classId) && a.date === date);
  const records  = existing ? existing.records : {};

  // Extract total sessions from pkg string
}

let currentAttRecords = {};
function setAtt(studentId, status, btn) {
  currentAttRecords[studentId] = status;
  // Update button styles
  const row = document.getElementById('att-row-'+studentId);
  row.querySelectorAll('.att-radio-btn').forEach(b => {
    b.classList.remove('present','absent-ex','absent-no');
  });
  const cls = status==='present'?'present':status==='absent-ex'?'absent-ex':'absent-no';
  btn.classList.add(cls);
}

function saveAttendance(classId, date) {
  const rows = document.querySelectorAll('[id^="att-row-"]');
  const records = {};
  rows.forEach(row => {
    const sid = row.id.replace('att-row-','');
    const active = row.querySelector('.att-radio-btn.present,.att-radio-btn.absent-ex,.att-radio-btn.absent-no');
    if (active) {
      records[sid] = active.classList.contains('present') ? 'present'
        : active.classList.contains('absent-ex') ? 'absent-ex' : 'absent-no';
    }
  });

  const idx = attendance.findIndex(a => String(a.classId)===String(classId) && a.date===date);
  const session = document.getElementById('att-session').value;
  const obj = { id: Date.now(), classId, date, session: Number(session)||0, records };
  if (idx !== -1) attendance[idx] = { ...attendance[idx], ...obj };
  else attendance.push(obj);

  // Auto-create makeup for absent-ex
  Object.entries(records).forEach(([sid, status]) => {
    if (status === 'absent-ex') {
      const alreadyExists = makeups.find(m => m.studentId === Number(sid) && m.absentDate === date);
      if (!alreadyExists) {
        const st = students.find(s => String(s.id) === String(sid));
        makeups.push({
          id: Date.now() + Math.random(),
          studentId: Number(sid),
          studentName: st ? st.name : '',
          classId,
          absentDate: date,
          absentType: 'Vắng có phép',
          makeupDate: '',
          status: 'pending',
          note: 'Tự động tạo từ điểm danh'
        });
      }
    }
  });

  save();
  showToast('Đã lưu điểm danh thành công!');
  loadAttStudents();
}

// ════════════════════════════════════════
// ── BÙ LỊCH ──
// ════════════════════════════════════════
function initMakeupSelects() {
  const sel = document.getElementById('mk-student');
  if (sel) {
    sel.innerHTML = '<option value="">-- Chọn học viên --</option>'
      + students.map(s => `<option value="${s.id}">${s.name} – ${s.subject}</option>`).join('');
  }
  const csel = document.getElementById('mk-class');
  if (csel) {
    csel.innerHTML = '<option value="">-- Chọn lớp --</option>'
      + classes.map(c => `<option value="${c.id}">[${c.code}] ${c.name}</option>`).join('');
  }
}

function setMakeupFilter(f, el) {
  makeupFilter = f;
  document.querySelectorAll('#page-makeup .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderMakeupTable();
}

function renderMakeupTable() {
  const q = (document.getElementById('makeup-search').value||'').toLowerCase();
  const filtered = makeups.filter(m => {
    const mq = !q || (m.studentName||'').toLowerCase().includes(q);
    const mf = makeupFilter==='all' || (makeupFilter==='pending'&&m.status==='pending') || (makeupFilter==='done'&&m.status==='done');
    return mq && mf;
  });
  // Stats
  document.getElementById('mk-total').textContent   = makeups.length;
  document.getElementById('mk-pending').textContent = makeups.filter(m=>m.status==='pending').length;
  document.getElementById('mk-done').textContent    = makeups.filter(m=>m.status==='done').length;

  const tbody = document.getElementById('makeup-table-body');
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🔄</div><div class="empty-text">Không có buổi bù nào</div></div></td></tr>`; return; }
  tbody.innerHTML = filtered.map((m,i) => {
    const cls = classes.find(c => String(c.id)===String(m.classId));
    const statusBadge = m.status==='done'
      ? `<span class="badge badge-paid">✅ Đã Bù</span>`
      : `<span class="badge badge-unpaid">⏳ Chưa Bù</span>`;
    const typeBadge = m.absentType==='Vắng có phép'
      ? `<span class="badge" style="background:#fff7ed;color:#92400e;border:1.5px solid #f59e0b;">📋 Có Phép</span>`
      : `<span class="badge" style="background:#fef2f2;color:#dc2626;border:1.5px solid #f87171;">❌ Không Phép</span>`;
    return `<tr>
      <td>${i+1}</td>
      <td class="td-name">${m.studentName||'–'}</td>
      <td>${cls?`<span class="pos-badge">[${cls.code}]</span>`:'–'}</td>
      <td style="font-size:11.5px;">${fmtDate(m.absentDate)}</td>
      <td>${typeBadge}</td>
      <td style="font-size:11.5px;">${m.makeupDate?fmtDate(m.makeupDate):'<span style="color:var(--muted)">Chưa xếp</span>'}</td>
      <td>${statusBadge}</td>
      <td style="font-size:11px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.note||''}">${m.note||'–'}</td>
      <td><div class="action-btns">
        ${m.status==='pending'?`<button class="btn-icon" onclick="markMakeupDone(${m.id})" title="Đánh dấu đã bù" style="color:#16a34a;border-color:#4ade80;">✓</button>`:''}
        <button class="btn-icon" onclick="editMakeup(${m.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteMakeup(${m.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

function markMakeupDone(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  m.status = 'done';
  if (!m.makeupDate) m.makeupDate = new Date().toISOString().slice(0,10);
  save(); renderMakeupTable(); showToast('Đã đánh dấu buổi bù hoàn thành!');
}

function openAddMakeup() {
  editMakeupId = null;
  initMakeupSelects();
  document.getElementById('mk-absent-date').value = '';
  document.getElementById('mk-makeup-date').value = '';
  document.getElementById('mk-absent-type').value = '';
  document.getElementById('mk-status').value = 'pending';
  document.getElementById('mk-note').value = '';
  document.getElementById('makeup-modal-title').textContent = 'Thêm Buổi Bù';
  document.getElementById('makeup-modal').classList.add('open');
}

function editMakeup(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  editMakeupId = id;
  initMakeupSelects();
  document.getElementById('mk-student').value     = m.studentId||'';
  document.getElementById('mk-class').value       = m.classId||'';
  document.getElementById('mk-absent-date').value = m.absentDate||'';
  document.getElementById('mk-absent-type').value = m.absentType||'';
  document.getElementById('mk-makeup-date').value = m.makeupDate||'';
  document.getElementById('mk-status').value      = m.status||'pending';
  document.getElementById('mk-note').value        = m.note||'';
  document.getElementById('makeup-modal-title').textContent = 'Sửa Buổi Bù';
  document.getElementById('makeup-modal').classList.add('open');
}

function saveMakeup() {
  const studentId   = Number(document.getElementById('mk-student').value);
  const classId     = document.getElementById('mk-class').value;
  const absentDate  = document.getElementById('mk-absent-date').value;
  const absentType  = document.getElementById('mk-absent-type').value;
  const makeupDate  = document.getElementById('mk-makeup-date').value;
  const status      = document.getElementById('mk-status').value;
  const note        = document.getElementById('mk-note').value.trim();
  if (!studentId || !absentDate || !absentType) { showToast('Vui lòng điền đầy đủ thông tin bắt buộc', true); return; }
  const st = students.find(s => s.id===studentId);
  const obj = { id: editMakeupId||Date.now(), studentId, studentName: st?st.name:'', classId, absentDate, absentType, makeupDate, status, note };
  if (editMakeupId) {
    const i = makeups.findIndex(m => m.id===editMakeupId);
    if (i!==-1) makeups[i] = obj;
    editMakeupId = null;
  } else makeups.push(obj);
  save(); closeMakeupModal(); renderMakeupTable(); showToast('Đã lưu buổi bù!');
}

function deleteMakeup(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  confirmDelete(m.studentName+' ('+fmtDate(m.absentDate)+')', () => {
    makeups = makeups.filter(x => x.id!==id);
    save(); renderMakeupTable(); showToast('Đã xóa buổi bù.');
  });
}

function closeMakeupModal() { document.getElementById('makeup-modal').classList.remove('open'); }

// ════════════════════════════════════════
// ── TƯ VẤN & TIN NHẮN MẪU ──
// ════════════════════════════════════════
function initConsultPage() {
  setConsultTab(consultTab, null);
  renderTemplates();
}

function setConsultTab(tab, el) {
  consultTab = tab;
  document.querySelectorAll('#page-consult .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    document.querySelectorAll('#page-consult .filter-tab').forEach(t => {
      if ((t.textContent||'').includes(tab==='process'?'Quy Trình':'Tin Nhắn')) t.classList.add('active');
    });
  }
  ['process','templates'].forEach(t => {
    const el = document.getElementById('consult-tab-'+t);
    if (el) el.style.display = t===tab ? '' : 'none';
  });
  if (tab==='templates') renderTemplates();
}

function generateGroupMsg() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const course = document.getElementById('cf-course').value.trim();
  const note   = document.getElementById('cf-note').value.trim();
  if (!name) { showToast('Vui lòng nhập tên học viên', true); return; }
  const now = new Date();
  const timeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  const text = `KH MỚI – ${timeStr}\n${'─'.repeat(30)}\nHọc Viên  : ${name}\nĐộ Tuổi   : ${age||'–'}\nPH Zalo   : ${parent||'–'}\nMôn Học   : ${course||'–'}\nGhi Chú   : ${note||'–'}\n${'─'.repeat(30)}\nTrạng Thái: Đang tư vấn`;
  document.getElementById('cf-output').textContent = text;
  document.getElementById('cf-output-wrap').style.display = 'block';
}

function copyGroupMsg() {
  const text = document.getElementById('cf-output').textContent;
  navigator.clipboard.writeText(text).then(()=>{}).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);});
  const cf = document.getElementById('cf-copied');
  cf.style.display='block'; setTimeout(()=>cf.style.display='none',3000);
}

let activeCourseGroup = null;

function renderTemplates() {
  const q = (document.getElementById('template-search')||{value:''}).value.toLowerCase();
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  // Build groups
  const groups = {};
  templates.forEach(t => {
    if (!groups[t.course]) groups[t.course] = { emoji: t.emoji||'💬', items: [] };
    groups[t.course].items.push(t);
  });

  // Filter by search
  const filteredGroups = {};
  Object.entries(groups).forEach(([course, g]) => {
    const matchGroup = !q || course.toLowerCase().includes(q);
    const matchItems = g.items.filter(t => !q || t.content.toLowerCase().includes(q) || course.toLowerCase().includes(q));
    if (matchGroup || matchItems.length) {
      filteredGroups[course] = { ...g, items: matchGroup ? g.items : matchItems };
    }
  });

  if (!Object.keys(filteredGroups).length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:40px;"><div class="empty-icon">💬</div><div class="empty-text">Chưa có tin nhắn mẫu nào.<br>Nhấn "+ Thêm Tin Nhắn Mẫu" để tạo mới.</div></div>`;
    return;
  }

  // If search active, show all flat
  if (q) {
    activeCourseGroup = null;
    let html = `<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">`;
    Object.entries(filteredGroups).forEach(([course, g]) => {
      g.items.forEach(t => {
        html += buildTemplateCard(t);
      });
    });
    html += '</div>';
    grid.innerHTML = html;
    return;
  }

  // Level 1: môn tabs (if no group selected)
  if (!activeCourseGroup || !filteredGroups[activeCourseGroup]) {
    activeCourseGroup = null;
    grid.innerHTML = `
      <div style="grid-column:1/-1;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
          ${Object.entries(filteredGroups).map(([course, g]) => `
            <button onclick="selectCourseGroup('${course.replace(/'/g,"\\'")}');"
              style="display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid rgba(200,146,42,.15);border-radius:12px;padding:10px 16px;cursor:pointer;transition:all .2s;font-family:'Be Vietnam Pro',sans-serif;min-width:160px;"
              onmouseover="this.style.borderColor='var(--gold)';this.style.background='var(--cream)';"
              onmouseout="this.style.borderColor='rgba(200,146,42,.15)';this.style.background='var(--white)';">
              <span style="font-size:22px;">${g.emoji}</span>
              <div style="text-align:left;">
                <div style="font-size:12px;font-weight:800;color:var(--navy);">${course}</div>
                <div style="font-size:10px;color:var(--muted);">${g.items.length} tin nhắn mẫu</div>
              </div>
              <span style="margin-left:auto;color:var(--gold);font-size:16px;">›</span>
            </button>`).join('')}
          <button onclick="openAddTemplate();" style="display:flex;align-items:center;gap:8px;background:var(--cream);border:1.5px dashed var(--gold);border-radius:12px;padding:10px 16px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;min-width:160px;color:var(--gold);font-weight:700;font-size:12px;">
            <span style="font-size:22px;">＋</span> Thêm Mẫu Mới
          </button>
        </div>
      </div>`;
    return;
  }

  // Level 2: cards in selected group
  const g = filteredGroups[activeCourseGroup];
  grid.innerHTML = `
    <div style="grid-column:1/-1;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <button onclick="activeCourseGroup=null;renderTemplates();" style="background:var(--cream);border:1.5px solid var(--cream2);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:var(--navy);font-family:'Be Vietnam Pro',sans-serif;">← Quay lại</button>
        <span style="font-size:22px;">${g.emoji}</span>
        <div style="font-size:16px;font-weight:800;color:var(--navy);">${activeCourseGroup}</div>
        <button onclick="openAddTemplate('${activeCourseGroup.replace(/'/g,"\\'")}');" style="margin-left:auto;background:var(--gold);color:#fff;border:none;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:11px;font-weight:700;font-family:'Be Vietnam Pro',sans-serif;">+ Thêm mẫu</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">
        ${g.items.map(t => buildTemplateCard(t)).join('')}
      </div>
    </div>`;
}

function buildTemplateCard(t) {
  const preview = t.content.length > 120 ? t.content.slice(0, 120) + '…' : t.content;
  return `<div style="background:var(--white);border-radius:12px;border:1.5px solid rgba(200,146,42,.12);box-shadow:var(--shadow-sm);overflow:hidden;display:flex;flex-direction:column;">
    <div style="background:var(--navy);padding:10px 14px;">
      <div style="font-size:11px;font-weight:800;color:var(--gold);letter-spacing:.5px;">${t.course}</div>
    </div>
    <div style="padding:12px 14px;flex:1;">
      <div style="background:var(--cream);border-radius:8px;padding:10px;font-size:11.5px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;font-family:'Be Vietnam Pro',sans-serif;max-height:180px;overflow-y:auto;">${t.content}</div>
    </div>
    <div style="padding:10px 14px 12px;display:flex;gap:7px;border-top:1px solid var(--cream2);">
      <button onclick="copyTemplate(${t.id})" style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:7px 0;font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;flex:1;">📋 Sao Chép</button>
      <button onclick="editTemplate(${t.id})" style="background:var(--white);border:1.5px solid var(--cream2);color:var(--navy);border-radius:8px;padding:7px 11px;font-size:13px;cursor:pointer;" title="Sửa">✎</button>
      <button onclick="deleteTemplate(${t.id})" style="background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:8px;padding:7px 11px;font-size:14px;cursor:pointer;" title="Xóa">🗑</button>
    </div>
  </div>`;
}

function selectCourseGroup(course) {
  activeCourseGroup = course;
  renderTemplates();
}

function copyTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  navigator.clipboard.writeText(t.content).then(() => showToast('Đã sao chép tin nhắn! Dán vào Zalo ngay.')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value=t.content; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Đã sao chép!');
  });
}

function openAddTemplate(prefillCourse) {
  editTemplateId = null;
  document.getElementById('tpl-course').value  = prefillCourse || '';
  document.getElementById('tpl-emoji').value   = '';
  document.getElementById('tpl-content').value = '';
  document.getElementById('template-modal-title').textContent = 'Thêm Tin Nhắn Mẫu';
  document.getElementById('template-modal').classList.add('open');
}

function editTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  editTemplateId = id;
  document.getElementById('tpl-course').value  = t.course;
  document.getElementById('tpl-emoji').value   = t.emoji||'';
  document.getElementById('tpl-content').value = t.content;
  document.getElementById('template-modal-title').textContent = 'Sửa Tin Nhắn Mẫu';
  document.getElementById('template-modal').classList.add('open');
}

function saveTemplate() {
  const course  = document.getElementById('tpl-course').value.trim();
  const emoji   = document.getElementById('tpl-emoji').value.trim() || '💬';
  const content = document.getElementById('tpl-content').value.trim();
  if (!course || !content) { showToast('Vui lòng điền tên môn và nội dung', true); return; }
  const obj = { id: editTemplateId||Date.now(), course, emoji, content };
  if (editTemplateId) {
    const i = templates.findIndex(t => t.id===editTemplateId);
    if (i!==-1) templates[i] = obj;
    editTemplateId = null;
  } else templates.push(obj);
  save(); closeTemplateModal(); renderTemplates(); showToast('Đã lưu tin nhắn mẫu!');
}

function deleteTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  confirmDelete(t.course, () => {
    templates = templates.filter(x => x.id!==id);
    save(); renderTemplates(); showToast('Đã xóa tin nhắn mẫu.');
  });
}

function closeTemplateModal() { document.getElementById('template-modal').classList.remove('open'); }

// Form thu thập thông tin tư vấn
function copyConsultForm() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const phone  = document.getElementById('cf-phone').value.trim();
  const course = document.getElementById('cf-course').value;
  const note   = document.getElementById('cf-note').value.trim();
  if (!name||!parent||!phone) { showToast('Vui lòng điền đủ tên HV, tên PH và SĐT', true); return; }
  const text = `HV MỚI 🎵\n- Tên HV: ${name}${age?' ('+age+')':''}\n- Phụ huynh: ${parent}\n- SĐT: ${phone}${course?'\n- Môn quan tâm: '+course:''}${note?'\n- Lưu ý: '+note:''}`;
  navigator.clipboard.writeText(text).then(() => {}).catch(()=>{ const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); });
  const cf = document.getElementById('cf-copied');
  cf.style.display='block'; setTimeout(()=>cf.style.display='none',3000);
}

function saveLeadFromForm() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const course = document.getElementById('cf-course').value.trim();
  const note   = document.getElementById('cf-note').value.trim();
  if (!name||!parent) { showToast('Vui lòng điền tên HV và tên phụ huynh', true); return; }
  leads.push({ id: Date.now(), name, dob:'', parent, phone:'', course: course||'Chưa xác định', source:'Trực tiếp', status:'Đã tư vấn', note: (age?'Độ tuổi: '+age+'. ':'')+(note||''), createdAt: new Date().toISOString().slice(0,10) });
  save(); clearConsultForm(); showToast('Đã lưu vào HV Tiềm Năng!');
}

function clearConsultForm() {
  ['cf-name','cf-age','cf-parent','cf-course','cf-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const wrap = document.getElementById('cf-output-wrap');
  if (wrap) wrap.style.display='none';
}

function copyGroupTemplate() {
  const text = 'HV MỚI 🎵\n- Tên HV: [Tên học viên]\n- Độ tuổi: [Tuổi]\n- Phụ huynh: [Tên PH]\n- SĐT: [Số điện thoại]\n- Môn quan tâm: [Môn học]\n- Lưu ý: [Ghi chú thêm]';
  navigator.clipboard.writeText(text).then(()=>showToast('Đã sao chép mẫu gửi nhóm!')).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('Đã sao chép!');});
}

// Backup / Restore
function exportBackup() {
  const data = { students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`vinsoul_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  showToast('Đã tải file backup!');
}

function importBackup() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange = e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.students) students = data.students;
        if (data.staff)    staff    = data.staff;
        if (data.leads)    leads    = data.leads;
        if (data.classes)  classes  = data.classes;
        if (data.attendance) attendance = data.attendance;
        if (data.makeups)    makeups    = data.makeups;
        if (data.templates)  templates  = data.templates;
        if (data.customCourses) customCourses = data.customCourses;
        if (data.customPrices)  customPrices  = data.customPrices;
    if (data.staffRoles) staffRoles = data.staffRoles;
    populateDynamicSelects();
    renderSettingsRoles();
    if (data.expenses)      expenses      = data.expenses;
        saveAsync().then(ok => { if (ok) { renderDashboard(); renderCoursesPage(); showToast('Khôi phục dữ liệu thành công!'); } });
      } catch { showToast('File backup không hợp lệ!', true); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── SEED TIN NHẮN MẪU (từ data chính thức) ──
function seedTemplatesIfEmpty() {
  if (templates.length > 0) return;
  const N = 'Anh/chị có thể tham gia buổi học trải nghiệm trước khi đăng ký lớp chính thức ạ.';
  const N5 = 'Anh/chị có thể tham gia buổi học trải nghiệm (500.000đ) trước khi đăng ký lớp chính thức ạ.';
  const N1 = 'Anh/chị có thể tham gia buổi học trải nghiệm (100.000đ) trước khi đăng ký lớp chính thức ạ.';

  function mk(course, emoji, items) {
    return items.map(([title, fee, time, buoi, freq, dong2, noi_dung, after, note]) => ({
      id: Date.now() + Math.random(),
      course, emoji,
      content: `${title}\n💰 Học phí: ${fee}\n⏱ Thời lượng: ${time} (${buoi})\n📅 Tần suất: ${freq}${dong2 ? '\n💳 Đóng 2 lần: ' + dong2 : ''}\n\n📚 Nội dung khóa học:\n${noi_dung}\n\n✨ ${after}\n${note}`
    }));
  }

  const GUITAR_ND = `1️⃣ Làm quen guitar và kỹ thuật cơ bản\n2️⃣ Học hợp âm, tiết tấu\n3️⃣ Học cách đệm các bài hát quen thuộc\n4️⃣ Thực hành đệm và biểu diễn các bài yêu thích`;
  const GUITAR_AF = 'Sau khóa học, học viên có thể tự đệm và trình diễn tự tin cùng nhạc cụ.';
  const LTG_ND = `1️⃣ Ôn luyện kỹ thuật guitar chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTG_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi guitar với kỹ thuật vững chắc.';

  const VIOLIN_ND = `1️⃣ Làm quen violin và tư thế cầm đàn đúng\n2️⃣ Học kỹ thuật kéo vĩ cung cơ bản\n3️⃣ Học đọc nhạc và luyện tập giai điệu\n4️⃣ Thực hành biểu diễn các bản nhạc đơn giản`;
  const VIOLIN_AF = 'Sau khóa học, học viên có thể chơi được các bản nhạc cơ bản và tự tin biểu diễn.';
  const LTV_ND = `1️⃣ Ôn luyện kỹ thuật violin chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTV_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi violin với kỹ thuật vững chắc.';

  const PIANO_ND = `1️⃣ Làm quen piano và hợp âm cơ bản\n2️⃣ Học đọc nhạc và luyện ngón tay\n3️⃣ Học đệm và chơi các bản nhạc đơn giản\n4️⃣ Thực hành chơi các bài nhạc yêu thích`;
  const PIANO_AF = 'Sau khóa học, học viên có thể tự chơi piano và đệm hát một số bài hát phổ biến.';
  const LTP_ND = `1️⃣ Ôn luyện kỹ thuật piano chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTP_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi piano với kỹ thuật vững chắc.';

  const PDH_ND = `1️⃣ Làm quen piano và hợp âm cơ bản\n2️⃣ Học cách đệm hát các bài hát quen thuộc\n3️⃣ Học pattern đệm piano đơn giản\n4️⃣ Thực hành đệm và hát các bài yêu thích`;
  const PDH_AF = 'Sau khóa học, học viên có thể tự đệm và hát một số bài hát phổ biến.';

  const UKU_ND = `1️⃣ Làm quen ukulele và tiết tấu cơ bản\n2️⃣ Học hợp âm và kỹ thuật gảy đàn\n3️⃣ Học đệm các bài hát vui và dễ chơi\n4️⃣ Thực hành đệm hát các bài yêu thích`;
  const UKU_AF = 'Sau khóa học, học viên có thể tự đệm hát được nhiều bài nhạc phổ biến một cách tự tin.';

  const TN_ND = `1️⃣ Luyện giọng và hơi thở cơ bản\n2️⃣ Học kỹ thuật hát rõ lời, lấy hơi đúng\n3️⃣ Học xử lý cảm xúc qua giọng hát\n4️⃣ Thực hành thể hiện các bài hát yêu thích`;
  const TN_AF = 'Sau khóa học, học viên có thể hát đúng kỹ thuật và tự tin biểu diễn trước đám đông.';

  const MN_ND = `1️⃣ Làm quen màu sắc và hình khối cơ bản\n2️⃣ Vẽ các hình đơn giản theo chủ đề\n3️⃣ Phát triển sự sáng tạo qua các bài tập\n4️⃣ Tạo ra các tác phẩm nghệ thuật đơn giản`;
  const CB_ND = `1️⃣ Kỹ thuật vẽ phác thảo và đường nét\n2️⃣ Học bố cục, ánh sáng và bóng đổ\n3️⃣ Vẽ tĩnh vật và phong cảnh cơ bản\n4️⃣ Thực hành hoàn thiện các bài vẽ hoàn chỉnh`;
  const KH_ND = `1️⃣ Làm quen chất liệu và dụng cụ vẽ chuyên biệt\n2️⃣ Học kỹ thuật xử lý màu đặc trưng theo từng chất liệu\n3️⃣ Thực hành vẽ các chủ đề đa dạng\n4️⃣ Hoàn thiện bài vẽ bằng chất liệu đã chọn`;
  const AC_ND = `1️⃣ Làm quen với canvas hoặc bảng vẽ kỹ thuật số\n2️⃣ Học kỹ thuật pha màu và xây dựng lớp màu\n3️⃣ Thực hành vẽ tác phẩm trên canvas hoặc phần mềm\n4️⃣ Hoàn thiện và trình bày tác phẩm cá nhân`;
  const LTV_ND2 = `1️⃣ Ôn luyện kỹ thuật vẽ chuyên sâu theo đề thi\n2️⃣ Học bố cục, tỉ lệ và biểu đạt cảm xúc trên tranh\n3️⃣ Luyện tập theo đúng thể thức và thời gian thi\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;

  const B35_ND = `1️⃣ Làm quen với âm nhạc và chuyển động cơ bản\n2️⃣ Học tư thế đứng đúng và khả năng cân bằng\n3️⃣ Luyện tập các bước nhảy ballet đơn giản\n4️⃣ Biểu diễn các bài múa ngắn theo chủ đề`;
  const B69_ND = `1️⃣ Ôn luyện tư thế và kỹ thuật ballet cơ bản\n2️⃣ Học các bước nhảy và chuyển động trung cấp\n3️⃣ Luyện tập phối hợp nhịp điệu và âm nhạc\n4️⃣ Biểu diễn bài múa hoàn chỉnh cuối khóa`;
  const DA_ND = `1️⃣ Khởi động cơ thể và học nhịp điệu cơ bản\n2️⃣ Học các vũ đạo hiện đại phổ biến\n3️⃣ Luyện tập phối hợp nhóm và đồng điệu\n4️⃣ Biểu diễn bài múa nhóm cuối khóa`;
  const KV_ND = `1️⃣ Làm quen các điệu nhảy khiêu vũ cơ bản\n2️⃣ Học tư thế, bước đi và dẫn dắt\n3️⃣ Luyện tập phối hợp cặp đôi hoặc nhóm\n4️⃣ Thực hành nhảy trong các tình huống thực tế`;
  const MCT_ND = `1️⃣ Tìm hiểu về múa cổ trang và văn hóa dân tộc\n2️⃣ Học các động tác tay, chân đặc trưng\n3️⃣ Luyện tập biểu cảm và dáng điệu trên nhạc cụ thể\n4️⃣ Biểu diễn bài múa hoàn chỉnh theo chủ đề cổ trang`;
  const HT_ND = `1️⃣ Tìm hiểu môn học và không gian lớp học\n2️⃣ Trải nghiệm trực tiếp cùng giáo viên\n3️⃣ Nhận tư vấn lộ trình học phù hợp\n4️⃣ Giải đáp mọi thắc mắc trước khi đăng ký`;

  const allTemplates = [
    ...mk('Guitar','🎸', [
      ['🎸 GUITAR — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',GUITAR_ND,GUITAR_AF,N5],
      ['🎸 GUITAR — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N5],
    ]),
    ...mk('Luyện Thi Guitar','🏆', [
      ['🎸 LUYỆN THI GUITAR — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTG_ND,LTG_AF,N5],
      ['🎸 LUYỆN THI GUITAR — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N5],
    ]),
    ...mk('Violin','🎻', [
      ['🎻 VIOLIN — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',VIOLIN_ND,VIOLIN_AF,N5],
      ['🎻 VIOLIN — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N5],
    ]),
    ...mk('Luyện Thi Violin','🏆', [
      ['🎻 LUYỆN THI VIOLIN — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTV_ND,LTV_AF,N5],
      ['🎻 LUYỆN THI VIOLIN — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N5],
    ]),
    ...mk('Piano','🎹', [
      ['🎹 PIANO — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',PIANO_ND,PIANO_AF,N5],
      ['🎹 PIANO — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N5],
    ]),
    ...mk('Luyện Thi Piano','🏆', [
      ['🎹 LUYỆN THI PIANO — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTP_ND,LTP_AF,N5],
      ['🎹 LUYỆN THI PIANO — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N5],
    ]),
    ...mk('Piano Đệm Hát','🎹🎤', [
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 1-1 CÁ NHÂN (3 THÁNG)','4.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.100.000đ/lần',PDH_ND,PDH_AF,'Anh/chị có thể tham gia buổi workshop cảm thụ âm nhạc trước khi đăng ký ạ.'],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 1-1 CÁ NHÂN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,'Anh/chị có thể tham gia buổi workshop cảm thụ âm nhạc trước khi đăng ký ạ.'],
    ]),
    ...mk('Ukulele','🪕', [
      ['🪕 UKULELE — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',UKU_ND,UKU_AF,N5],
      ['🪕 UKULELE — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N5],
    ]),
    ...mk('Thanh Nhạc','🎤', [
      ['🎤 THANH NHẠC — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',TN_ND,TN_AF,N],
      ['🎤 THANH NHẠC — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',TN_ND,TN_AF,N],
      ['🎤 THANH NHẠC — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',TN_ND,TN_AF,N5],
      ['🎤 THANH NHẠC — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',TN_ND,TN_AF,N5],
    ]),
    ...mk('Vẽ – Mầm Non','🖍️', [
      ['🖍️ VẼ MẦM NON — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',MN_ND,'Sau khóa học, bé có nền tảng cảm nhận màu sắc, hình dạng và khả năng sáng tạo tự do.',N1],
      ['🖍️ VẼ MẦM NON — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',MN_ND,'Sau khóa học, bé có nền tảng cảm nhận màu sắc, hình dạng và khả năng sáng tạo tự do.',N1],
    ]),
    ...mk('Vẽ – Căn Bản','✏️', [
      ['✏️ VẼ CĂN BẢN — LỚP NHÓM (3 THÁNG)','3.300.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.650.000đ/lần',CB_ND,'Sau khóa học, học viên có nền tảng vẽ căn bản vững chắc để học các kỹ thuật nâng cao hơn.',N1],
      ['✏️ VẼ CĂN BẢN — LỚP NHÓM (1 THÁNG)','1.300.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',CB_ND,'Sau khóa học, học viên có nền tảng vẽ căn bản vững chắc để học các kỹ thuật nâng cao hơn.',N1],
    ]),
    ...mk('Vẽ – Ký Họa / Màu Nước / Marker','🖊️', [
      ['🖊️ KÝ HỌA / MÀU NƯỚC / MÀU MARKER — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',KH_ND,'Sau khóa học, học viên có thể sử dụng thành thạo chất liệu đã học và thể hiện phong cách riêng.',N1],
      ['🖊️ KÝ HỌA / MÀU NƯỚC / MÀU MARKER — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',KH_ND,'Sau khóa học, học viên có thể sử dụng thành thạo chất liệu đã học và thể hiện phong cách riêng.',N1],
    ]),
    ...mk('Vẽ – Acrylic / Digital Art','🖼️', [
      ['🖼️ MÀU ACRYLIC CANVAS / DIGITAL ART — LỚP NHÓM (3 THÁNG)','4.800.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.400.000đ/lần',AC_ND,'Sau khóa học, học viên có thể tạo ra các tác phẩm hội họa hoàn chỉnh trên canvas hoặc môi trường số.',N1],
      ['🖼️ MÀU ACRYLIC CANVAS / DIGITAL ART — LỚP NHÓM (1 THÁNG)','1.800.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',AC_ND,'Sau khóa học, học viên có thể tạo ra các tác phẩm hội họa hoàn chỉnh trên canvas hoặc môi trường số.',N1],
    ]),
    ...mk('Luyện Thi Vẽ','🎨', [
      ['🎨 LUYỆN THI VẼ — LỚP NHÓM (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',LTV_ND2,'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi mỹ thuật với kỹ năng và sự tự tin cao.',N1],
      ['🎨 LUYỆN THI VẼ — LỚP NHÓM (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND2,'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi mỹ thuật với kỹ năng và sự tự tin cao.',N1],
    ]),
    ...mk('Ballet 3–5 Tuổi','🩰', [
      ['🩰 BALLET 3–5 TUỔI — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',B35_ND,'Sau khóa học, bé phát triển sự dẻo dai, phối hợp cơ thể và tình yêu thích âm nhạc nghệ thuật.',N1],
      ['🩰 BALLET 3–5 TUỔI — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',B35_ND,'Sau khóa học, bé phát triển sự dẻo dai, phối hợp cơ thể và tình yêu thích âm nhạc nghệ thuật.',N1],
    ]),
    ...mk('Ballet 6–9 Tuổi','🩰', [
      ['🩰 BALLET 6–9 TUỔI — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',B69_ND,'Sau khóa học, học viên đạt được sự thành thục trong kỹ thuật ballet và tự tin trên sân khấu.',N1],
      ['🩰 BALLET 6–9 TUỔI — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',B69_ND,'Sau khóa học, học viên đạt được sự thành thục trong kỹ thuật ballet và tự tin trên sân khấu.',N1],
    ]),
    ...mk('Dance','💃', [
      ['💃 DANCE (NHẢY HIỆN ĐẠI) — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',DA_ND,'Sau khóa học, học viên có thể nhảy các phong cách hiện đại và tự tin biểu diễn trước mọi người.',N1],
      ['💃 DANCE (NHẢY HIỆN ĐẠI) — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',DA_ND,'Sau khóa học, học viên có thể nhảy các phong cách hiện đại và tự tin biểu diễn trước mọi người.',N1],
    ]),
    ...mk('Khiêu Vũ','🕺', [
      ['🕺 KHIÊU VŨ — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',KV_ND,'Sau khóa học, học viên có thể khiêu vũ tự tin trong các sự kiện, tiệc, giao lưu xã hội.',N1],
      ['🕺 KHIÊU VŨ — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',KV_ND,'Sau khóa học, học viên có thể khiêu vũ tự tin trong các sự kiện, tiệc, giao lưu xã hội.',N1],
    ]),
    ...mk('Múa Cổ Trang','🏮', [
      ['🏮 MÚA CỔ TRANG — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',MCT_ND,'Sau khóa học, học viên có thể biểu diễn múa cổ trang đúng phong cách và tự tin trên sân khấu.',N1],
      ['🏮 MÚA CỔ TRANG — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',MCT_ND,'Sau khóa học, học viên có thể biểu diễn múa cổ trang đúng phong cách và tự tin trên sân khấu.',N1],
    ]),
    ...mk('Học Thử','⭐', [
      ['🔔 HỌC THỬ — LỚP NHÓM (10:1)','100.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
      ['🔔 HỌC THỬ — LỚP 2 HỌC VIÊN (2-1)','250.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
      ['🔔 HỌC THỬ — LỚP 1-1 CÁ NHÂN','500.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
    ]),
  ];

  let baseId = Date.now();
  allTemplates.forEach((t, i) => { t.id = baseId + i; templates.push(t); });
  save();
}
// seedTemplatesIfEmpty se duoc goi trong initAppAfterLogin
// ── CHANGE PASSWORD MODAL ──
function showChangePasswordModal() {
  document.getElementById('cp-current').value = '';
  document.getElementById('cp-new').value = '';
  document.getElementById('cp-confirm').value = '';
  document.getElementById('cp-error').style.display = 'none';
  document.getElementById('cp-success').style.display = 'none';
  const modal = document.getElementById('change-pass-modal');
  modal.style.display = 'flex';
}


function openMyProfileModal() {
  document.getElementById('mp-display-name').value = window.VS_USER.displayName || window.VS_USER.username || '';
  document.getElementById('mp-phone').value = window.VS_USER.phone || '';
  document.getElementById('mp-email').value = window.VS_USER.email || '';
  document.getElementById('mp-bank-name').value = window.VS_USER.bankName || '';
  document.getElementById('mp-bank-account').value = window.VS_USER.bankAccount || '';
  
  document.getElementById('mp-current').value = '';
  document.getElementById('mp-new').value = '';
  document.getElementById('mp-confirm').value = '';
  
  const avatarUrl = window.VS_USER.avatar;
  if (avatarUrl) {
    document.getElementById('mp-avatar-preview').src = avatarUrl;
    document.getElementById('mp-avatar-preview').style.display = 'block';
    document.getElementById('mp-avatar-text').style.display = 'none';
  } else {
    document.getElementById('mp-avatar-preview').style.display = 'none';
    document.getElementById('mp-avatar-text').textContent = (window.VS_USER.displayName || 'U').substring(0,2).toUpperCase();
    document.getElementById('mp-avatar-text').style.display = 'flex';
  }
  
  document.getElementById('my-profile-modal').style.display = 'flex';
}

function previewMyAvatar(input) {
  if (input.files && input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      const img = document.getElementById('mp-avatar-preview');
      img.src = e.target.result;
      img.dataset.base64 = e.target.result;
      img.style.display = 'block';
      document.getElementById('mp-avatar-text').style.display = 'none';
    };
    r.readAsDataURL(input.files[0]);
  }
}

async function submitUpdateProfile() {
  const displayName = document.getElementById('mp-display-name').value.trim();
  const phone = document.getElementById('mp-phone').value.trim();
  const email = document.getElementById('mp-email').value.trim();
  const bankName = document.getElementById('mp-bank-name').value.trim();
  const bankAccount = document.getElementById('mp-bank-account').value.trim();
  const currentPass = document.getElementById('mp-current').value;
  const newPass = document.getElementById('mp-new').value;
  const confirmPass = document.getElementById('mp-confirm').value;
  const imgEl = document.getElementById('mp-avatar-preview');
  const avatarB64 = imgEl.dataset.base64 || '';

  if (!displayName) { showToast('Tên hiển thị không được để trống'); return; }
  if (newPass || confirmPass || currentPass) {
    if (!currentPass) { showToast('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (newPass.length < 8) { showToast('Mật khẩu mới ít nhất 8 ký tự'); return; }
    if (newPass !== confirmPass) { showToast('Xác nhận mật khẩu không khớp'); return; }
  }

  try {
    const payload = { displayName, phone, email, bankName, bankAccount };
    if (newPass) {
      payload.currentPassword = currentPass;
      payload.newPassword = newPass;
    }
    if (avatarB64) {
      payload.avatar = avatarB64;
    }

    const r = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vs_token') },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) { showToast(data.error || 'Lỗi cập nhật'); return; }
    
    showToast('Cập nhật hồ sơ thành công');
    
    window.VS_USER.displayName = data.displayName;
    window.VS_USER.phone = data.phone;
    window.VS_USER.email = data.email;
    window.VS_USER.bankName = data.bankName;
    window.VS_USER.bankAccount = data.bankAccount;
    if (data.avatar) window.VS_USER.avatar = data.avatar;
    
    window.VS_DISPLAY_NAME = data.displayName;
    if (data.avatar) window.VS_AVATAR = data.avatar;
    
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.textContent = data.displayName;
    
    if (window.VS_AVATAR) {
      const img = document.getElementById('nav-avatar-img');
      if (img) { img.src = window.VS_AVATAR; img.style.display = 'block'; }
      const txt = document.getElementById('nav-avatar-text');
      if (txt) txt.style.display = 'none';
    } else {
      const img = document.getElementById('nav-avatar-img');
      if (img) img.style.display = 'none';
      const txt = document.getElementById('nav-avatar-text');
      if (txt) { txt.textContent = data.displayName.substring(0,2).toUpperCase(); txt.style.display = 'flex'; }
    }

    document.getElementById('my-profile-modal').style.display = 'none';
    
    if (window.VS_ROLE === 'student' && typeof renderStudentOverview === 'function') renderStudentOverview();
    if (window.VS_ROLE === 'teacher' && typeof renderTeacherOverview === 'function') renderTeacherOverview();
  } catch(e) {
    showToast('Lỗi kết nối');
  }
}


window.initAppAfterLogin = async function() {
  try {
    const r    = await fetch('/api/load');
    if (!r.ok) throw new Error('Lỗi tải dữ liệu: ' + r.status);
    const data = await r.json();
    if (data.students)      students      = data.students;
    if (data.staff)         staff         = data.staff;
    if (data.leads)         leads         = data.leads;
    if (data.classes)       classes       = data.classes;
    if (data.attendance)    attendance    = data.attendance;
    if (data.makeups)       makeups       = data.makeups;
    if (data.templates)     templates     = data.templates;
    if (data.customCourses) customCourses = data.customCourses;
    if (data.customPrices)  customPrices  = data.customPrices;
    if (data.staffRoles) staffRoles = data.staffRoles;
    // Seed default teacher roles if none saved yet
    if (!staffRoles || staffRoles.length === 0) {
      staffRoles = [
        'Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele',
        'Giáo viên Trống','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance',
        'Giáo viên Khiêu Vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'
      ];
    }
    populateDynamicSelects();
    renderSettingsRoles();
    
    let staffUpdated = false;
    if (classes && staff) {
      classes.forEach(c => {
        if (c.teacher) {
          const existing = staff.find(s => (s.name || '').toLowerCase() === c.teacher.toLowerCase());
          if (!existing) {
            staffUpdated = true;
            const nextId = Date.now() + Math.floor(Math.random() * 1000) + staff.length;
            const newVsId = 'GV' + String(staff.length + 1).padStart(4, '0');
            const newStaff = { id: nextId, vsId: newVsId, name: c.teacher, dob: '', phone: '', role: 'Giáo Viên', status: 'Đang hoạt động', note: 'Tự động tạo từ TKB' };
            staff.push(newStaff);
            autoCreateStaffAccount(newStaff);
          }
        }
      });
      if (staffUpdated && typeof saveAsync === 'function') {
        saveAsync();
      }
    }
    renderDashboard();
    renderCoursesPage();
    seedTemplatesIfEmpty();

    // Hien menu Quan Tri Tai Khoan neu la admin
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role === 'admin') {
          const navSec = document.getElementById('nav-section-accounts');
          if (navSec) navSec.style.display = '';
        }
      }
    } catch(err) { console.error('Auth err', err); }
  } catch(e) {
    console.error('Lỗi load dữ liệu:', e);
    showToast('Lỗi load dữ liệu: ' + String(e.message || e), true);
  }
};

// ════════════════════════════════════════
//  QUẢN TRỊ TÀI KHOẢN
// ════════════════════════════════════════

function toggleLinkedFields() {
  const role = document.getElementById('acc-role')?.value;
  const sg = document.getElementById('linked-staff-group');
  const stg = document.getElementById('linked-student-group');
  if (sg)  sg.style.display  = role === 'teacher' ? '' : 'none';
  if (stg) stg.style.display = role === 'student'  ? '' : 'none';
}

async function renderAccountsPage() {
  // Fix: ensure page is full width inside .main
  const page = document.getElementById('page-accounts');
  if (page) { page.style.width='100%'; page.style.boxSizing='border-box'; page.style.overflowX='hidden'; }
  const wrap = document.getElementById('accounts-table-wrap');
  if (!wrap) return;
  wrap.style.width = '100%';
  wrap.style.overflowX = 'auto';
  wrap.style.boxSizing = 'border-box';
  wrap.innerHTML = '<div style="color:#aaa;font-size:13px;padding:10px;">Đang tải...</div>';
  try {
    const r = await fetch('/api/users');
    if (!r.ok) { wrap.innerHTML = '<div style="color:#D94F4F;font-size:13px;padding:10px;">Lỗi tải danh sách tài khoản</div>'; return; }
    const users = await r.json();
    const roleLabel = role => {
      const cfg = {
        admin:   {bg:'#FFF3CD',color:'#7a6000',border:'#FFE08A',text:'Quản Trị Viên'},
        staff:   {bg:'#E8F5E9',color:'#2E7D32',border:'#A5D6A7',text:'Nhân Viên'},
        teacher: {bg:'#EDE9FE',color:'#5b21b6',border:'#C4B5FD',text:'Giáo Viên'},
        student: {bg:'#DBEAFE',color:'#1e40af',border:'#93C5FD',text:'Học Viên'},
      }[role] || {bg:'#f3f4f6',color:'#374151',border:'#d1d5db',text:role};
      return `<span style="display:inline-block;background:${cfg.bg};color:${cfg.color};border:1.5px solid ${cfg.border};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;white-space:nowrap;">${cfg.text}</span>`;
    };
    window._cachedUsers = users;
    const rows=users.map((u,i)=> {
      const safeDisplay = (u.displayName||'').replace(/"/g,'&quot;');
      const linkedBadge = u.linkedStaffId
        ? `<span style="background:#dcfce7;color:#166534;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-left:4px;">${(staff||[]).find(s=>String(s.id)===String(u.linkedStaffId))?.vsId||'GV?'}</span>`
        : u.linkedStudentId
        ? `<span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-left:4px;">${(students||[]).find(s=>String(s.id)===String(u.linkedStudentId))?.vsId||'HV?'}</span>`
        : '';
      return `<tr>
        <td style="text-align:center;color:var(--muted);font-size:11px;">${i+1}</td>
        <td><div style="font-weight:700;color:var(--navy);font-size:13px;">${u.username}</div><div style="font-size:10px;color:var(--muted)">${u.id}</div></td>
        <td><div style="font-weight:600;font-size:13px;">${safeDisplay}</div>${linkedBadge}</td>
        <td>${roleLabel(u.role)}</td>
        <td style="text-align:center;">
          <div class="action-btns" style="justify-content:center;">
            <button class="btn-icon" onclick="openEditAccountModalById(${u.id})" title="Sửa">✎</button>
            <button class="btn-icon del" onclick="deleteAccount(${u.id},'${u.username}')" title="Xóa">✕</button>
          </div>
        </td>
      </tr>`;
    }).join('');
    wrap.innerHTML=`<div style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;"><table style="min-width:500px;width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="width:36px;text-align:center;">#</th>
        <th>Tên Đăng Nhập</th>
        <th>Họ Tên & Liên Kết</th>
        <th>Phân Quyền</th>
        <th style="width:90px;text-align:center;">Thao Tác</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  } catch {
    wrap.innerHTML = '<div style="color:#D94F4F;font-size:13px;padding:10px;">Lỗi kết nối server</div>';
  }
}

function openCreateAccountModal() {
  document.getElementById('account-modal-title').textContent = 'Cấp Tài Khoản Mới';
  document.getElementById('acc-edit-id').value = '';
  document.getElementById('acc-username').value = '';
  document.getElementById('acc-username').disabled = false;
  document.getElementById('acc-displayname').value = '';
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-password').placeholder = 'Ít nhất 8 ký tự';
  document.getElementById('acc-role').value = 'staff';
  if (document.getElementById('acc-linked-staff'))  document.getElementById('acc-linked-staff').value = '';
  if (document.getElementById('acc-linked-student')) document.getElementById('acc-linked-student').value = '';
  document.getElementById('acc-error').style.display = 'none';
  const ph = document.getElementById('acc-pass-hint');
  if (ph) ph.style.display = 'none';
  toggleLinkedFields();
  document.getElementById('account-modal').classList.add('open');
}

function openEditAccountModal(id, username, displayName, role, linkedStaffId, linkedStudentId) {
  document.getElementById('account-modal-title').textContent = 'Sửa Tài Khoản';
  document.getElementById('acc-edit-id').value = id;
  document.getElementById('acc-username').value = username;
  document.getElementById('acc-username').disabled = true;
  document.getElementById('acc-displayname').value = displayName;
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-password').placeholder = 'Để trống = giữ nguyên mật khẩu';
  document.getElementById('acc-role').value = role;
  if (document.getElementById('acc-linked-staff'))  document.getElementById('acc-linked-staff').value  = linkedStaffId||'';
  if (document.getElementById('acc-linked-student')) document.getElementById('acc-linked-student').value = linkedStudentId||'';
  document.getElementById('acc-error').style.display = 'none';
  const ph = document.getElementById('acc-pass-hint');
  if (ph) ph.style.display = '';
  toggleLinkedFields();
  document.getElementById('account-modal').classList.add('open');
}

function closeAccountModal() {
  document.getElementById('account-modal').classList.remove('open');
}

async function submitAccountForm() {
  const editId      = document.getElementById('acc-edit-id').value;
  const username    = document.getElementById('acc-username').value.trim();
  const displayName = document.getElementById('acc-displayname').value.trim();
  const password    = document.getElementById('acc-password').value;
  const role        = document.getElementById('acc-role').value;
  const errEl       = document.getElementById('acc-error');
  errEl.style.display = 'none';
  if (!displayName || !role) { errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; errEl.style.display = 'block'; return; }
  if (!editId && (!username || !password)) { errEl.textContent = 'Tên đăng nhập và mật khẩu là bắt buộc'; errEl.style.display = 'block'; return; }
  if (password && password.length < 8) { errEl.textContent = 'Mật khẩu ít nhất 8 ký tự'; errEl.style.display = 'block'; return; }
  const linkedStaffId   = document.getElementById('acc-linked-staff')?.value?.trim()||null;
  const linkedStudentId = document.getElementById('acc-linked-student')?.value?.trim()||null;
  try {
    let res;
    if (editId) {
      const body = { displayName, role };
      if (password) body.password = password;
      res = await fetch('/api/users/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, displayName, password, role }) });
    }
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Lỗi server'; errEl.style.display = 'block'; return; }
    closeAccountModal();
    showToast(editId ? 'Đã cập nhật tài khoản!' : 'Đã cấp tài khoản mới!');
    renderAccountsPage();
  } catch { errEl.textContent = 'Lỗi kết nối server'; errEl.style.display = 'block'; }
}

async function deleteAccount(id, username) {
  confirmDelete('tài khoản "' + username + '"', async () => {
    try {
      const res = await fetch('/api/users/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Lỗi xóa tài khoản', true); return; }
      showToast('Đã xóa tài khoản!');
      renderAccountsPage();
    } catch { showToast('Lỗi kết nối server', true); }
  });
}
function viewClassDetail(classId){
  const c=classes.find(x=>Number(x.id)===Number(classId));
  if(!c){showPage('classes');return;}
  const page=document.getElementById('page-class-detail');
  if(!page)return;
  const sched=(c.schedule||[]).map(s=>`<span class="pos-badge" style="font-size:11px;margin-right:4px;">${s.day} ${s.start}–${s.end}</span>`).join('')||'<span style="color:var(--muted)">Chưa có lịch</span>';
  const cs=students.filter(s=>Number(s.classid)===Number(classId));
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash">TM</span>`:`<span class="badge badge-unpaid">Chưa TT</span>`;
  const rows=cs.length===0
    ?`<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">Chưa có học viên nào trong lớp</div></div></td></tr>`
    :cs.map((s,i)=>`<tr>
      <td>${i+1}</td><td class="td-name">${s.name}</td>
      <td>${s.parent||'–'}</td><td>${s.phone||'–'}</td>
      <td style="font-weight:600;color:var(--navy)">${s.subject}${s.pkg?`<br><span style="font-size:10px;color:var(--muted)">${s.pkg}</span>`:''}</td>
      <td>${pb(s.payment)}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="editStudent(${s.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="removeStudentFromClass(${s.id},${classId})" title="Gỡ">✕</button>
      </div></td></tr>`).join('');
  page.innerHTML=`
    <div class="page-header">
      <div class="page-title">Chi Tiết <span>Lớp Học</span></div>
      <div class="page-sub">[${c.code}] ${c.name} – ${c.subject}</div>
    </div>
    <div class="card" style="margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:16px;">
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Mã Lớp</div><div style="font-weight:800;color:var(--navy);font-size:16px;">${c.code}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Khóa Học</div><div style="font-weight:700;color:var(--navy)">${c.subject}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Giáo Viên</div><div style="font-weight:600;">${c.teacher||'–'}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Phòng</div><div style="font-weight:600;">${c.room||'–'}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Số Học Viên</div><div style="font-weight:800;color:var(--gold);font-size:22px;">${cs.length}</div></div>
      </div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Lịch Học</div><div>${sched}</div></div>
      ${c.note?`<div style="margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--cream2);padding-top:10px;">Ghi chú: ${c.note}</div>`:''}
    </div>
    <div class="card">
      <div class="toolbar" style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:15px;color:var(--navy)">Danh Sách Học Viên <span style="color:var(--gold)">(${cs.length})</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="addStudentToClass(${classId})">+ Thêm Học Viên</button>
          <button class="btn btn-outline" onclick="editClass(${classId})">✎ Sửa Lớp</button>
          <button class="btn btn-outline" onclick="showPage('classes')">← Danh Sách Lớp</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Họ Tên</th><th>Phụ Huynh</th><th>SĐT</th><th>Khóa Học</th><th>Học Phí</th><th>Thao Tác</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  showPage('class-detail');
}
function addStudentToClass(classId){
  editStudentId=null; clearStudentForm();
  const cls=classes.find(c=>Number(c.id)===Number(classId));
  showPage('add-student');
  setTimeout(()=>{
    if(cls){
      const se=document.getElementById('f-subject');
      if(se){se.value=cls.subject;populatePackages('');}
      setTimeout(()=>{
        const ce=document.getElementById('f-classid'); if(ce) ce.value=classId;
        const te=document.getElementById('form-title');
        if(te) te.innerHTML=`Thêm Học Viên vào <span>[${cls.code}] ${cls.name}</span>`;
        window._addStudentForClassId=classId;
      },60);
    }
  },60);
}
function removeStudentFromClass(studentId,classId){
  const s=students.find(x=>x.id===studentId); if(!s)return;
  confirmDelete('gỡ học viên '+s.name+' khỏi lớp',()=>{
    const i=students.findIndex(x=>x.id===studentId);
    if(i!==-1) students[i]={...students[i],classid:0};
    saveAsync().then(ok=>{if(ok){showToast('Đã gỡ '+s.name+' khỏi lớp.');viewClassDetail(classId);}});
  });
}

function populateDynamicSelects() {
  // Populate f-subject
  const fSubj = document.getElementById('f-subject-custom');
  if (fSubj) {
    let html = '';
    customCourses.forEach(c => {
      html += `<option value="${c.name}">${c.name}</option>`;
    });
    fSubj.innerHTML = html;
  }
  
  // Populate st-role
  const stRoleOpt = document.getElementById('st-role-teachers');
  if (stRoleOpt) {
    const roles = staffRoles.length ? staffRoles : ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
    let html = '';
    roles.forEach(r => html += `<option>${r}</option>`);
    stRoleOpt.innerHTML = html;
  }
}

function renderSettingsRoles() {
  const list = document.getElementById('settings-roles-list');
  if (!list) return;
  const roles = staffRoles.length ? staffRoles : ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
  list.innerHTML = roles.map((r,i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #eee;">
      <span style="font-weight:600;font-size:13px;color:var(--navy);">${r}</span>
      <button class="btn btn-outline" style="color:#dc2626;border-color:#fca5a5;padding:4px 8px;" onclick="deleteCustomRole(${i})">Xóa</button>
    </div>
  `).join('');
}

function addCustomRole() {
  const input = document.getElementById('set-role-name');
  const val = input.value.trim();
  if (!val) return;
  if (!staffRoles.length) {
    staffRoles = ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
  }
  if (!staffRoles.includes(val)) {
    staffRoles.push(val);
    save();
    input.value = '';
    renderSettingsRoles();
    populateDynamicSelects();
    showToast('Đã thêm chức vụ!');
  }
}

function deleteCustomRole(index) {
  confirmDelete('chức vụ', () => {
    staffRoles.splice(index, 1);
    save();
    renderSettingsRoles();
    populateDynamicSelects();
  });
}

function renderSettingsCourses() {
  const list = document.getElementById('settings-courses-list');
  if (!list) return;
  if (!customCourses.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:10px;">Chưa có môn học tùy chỉnh nào.</div>';
    return;
  }
  list.innerHTML = customCourses.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #eee;">
      <div>
        <span style="font-weight:600;font-size:13px;color:var(--navy);">${c.emoji} ${c.name}</span>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">Ký hiệu: ${c.key}</div>
      </div>
      <div>
        <button class="btn btn-outline" style="padding:4px 8px;margin-right:4px;" onclick="editCustomCourse('${c.key}');showPage('courses');">Sửa gói</button>
        <button class="btn btn-outline" style="color:#dc2626;border-color:#fca5a5;padding:4px 8px;" onclick="deleteCustomCourse('${c.key}');setTimeout(renderSettingsCourses,500);">Xóa</button>
      </div>
    </div>
  `).join('');
}

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
window.applyRBAC = function(role) {
    window.VS_ROLE = role;
    document.body.setAttribute('data-role', role);
    
    // Hide all sections first
    const sections = document.querySelectorAll('#sidebar-menu .nav-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
        const roles = sec.getAttribute('data-roles');
        if (roles && roles.split(',').includes(role)) {
            sec.style.display = 'block';
        }
    });

    // Special case routing
    if (role === 'HOC_VIEN' || role === 'GIAO_VIEN') {
        setTimeout(() => showPage('dashboard'), 100);
    }
};

window.toggleSidebar = function() {
    document.body.classList.toggle('sidebar-collapsed');
};

window.filterSidebar = function() {
    const q = document.getElementById('sidebarSearch').value.toLowerCase();
    document.querySelectorAll('#sidebar-menu .nav-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
    });
};

// ── STATE ──
let students      = [];
let classes       = [];
let customCourses = [];
let customPrices  = {};
let staffRoles    = [];
let staff         = [];
let attendance    = [];
let leads         = [];
let expenses      = [];
let makeups       = [];
let templates     = [];
let editStudentId = null;
let editStaffId   = null;
let editLeadId    = null;
let editMakeupId  = null;
let editTemplateId= null;
let studentFilter = 'all';
let studentClassFilter = 'all';
let studentSubjectFilter = 'all';
let staffFilter   = 'all';
let leadFilter    = 'all';
let makeupFilter  = 'all';
let consultTab    = 'process';


// ── STATIC COURSE LIST FOR FILTER TABS ──
const STATIC_COURSES = [
  {name:'Piano',      emoji:'🎹', match:'Piano'},
  {name:'Guitar',     emoji:'🎸', match:'Guitar'},
  {name:'Violin',     emoji:'🎻', match:'Violin'},
  {name:'Ukulele',    emoji:'🪕', match:'Ukulele'},
  {name:'Vẽ',         emoji:'🎨', match:'Vẽ'},
  {name:'Ballet',     emoji:'🩰', match:'Ballet'},
  {name:'Dance',      emoji:'💃', match:'Dance'},
  {name:'Khiêu Vũ',   emoji:'🕺', match:'Khiêu Vũ'},
  {name:'Múa Cổ Trang',emoji:'👘', match:'Múa Cổ Trang'},
  {name:'Thanh Nhạc', emoji:'🎤', match:'Thanh Nhạc'},
  {name:'Luyện Thi',  emoji:'🏆', match:'Luyện Thi'},
  {name:'Cảm Thụ Âm Nhạc', emoji:'🎼', match:'Cảm Thụ Âm Nhạc'},
  {name:'Piano Đệm Hát',   emoji:'🎹🎤', match:'Piano Đệm Hát'},
  {name:'Trống',      emoji:'🥁', match:'Trống'},
];

// ── HELPERS ──
const fmt     = n => Number(n||0).toLocaleString('vi-VN') + ' đ';
// ── Flatpickr: init tất cả date inputs thành DD/MM/YYYY ──
function initDatePickers(container) {
  const root = container || document;
  root.querySelectorAll('input[type="date"]').forEach(el => {
    if (el._fpInited) return;
    el._fpInited = true;
    const stored = el.value; // YYYY-MM-DD
    el.type = 'text';
    el.placeholder = 'DD/MM/YYYY';
    const fp = flatpickr(el, {
      locale: 'vn',
      dateFormat: 'd/m/Y',
      allowInput: true,
      defaultDate: stored || null,
      onChange: function(selectedDates, dateStr) {
        // Store as YYYY-MM-DD in dataset for form reads
        if (selectedDates[0]) {
          const d = selectedDates[0];
          const iso = d.getFullYear()+'-'
            +String(d.getMonth()+1).padStart(2,'0')+'-'
            +String(d.getDate()).padStart(2,'0');
          el.dataset.isoValue = iso;
        }
      }
    });
    // Override .value getter/setter to return ISO for form processing
    Object.defineProperty(el, '_isoValue', {
      get() { return el.dataset.isoValue || ''; },
      set(v) { el.dataset.isoValue = v; if(v) fp.setDate(v,false,'Y-m-d'); }
    });
  });
}

// Patch getElementById for date inputs to return ISO value
const _origGEBI = document.getElementById.bind(document);
function getDateVal(id) {
  const el = _origGEBI(id);
  if (!el) return '';
  return el.dataset.isoValue || el.value || '';
}

const fmtDate = d => { if (!d) return '–'; const p = d.split('-'); if (p.length === 3) return p[2]+'/'+p[1]+'/'+p[0]; return d; };
// Lưu dữ liệu lên server (không chặn UI)
function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices, expenses, staffRoles })
  }).catch(e => console.error('Lỗi lưu server:', e));
}

// Lưu dữ liệu lên server và chờ kết quả (dùng khi cần chắc chắn)
async function saveAsync() {
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices, expenses, staffRoles })
    });
    if (!r.ok) {
      const d = await r.json();
      showToast('Lỗi lưu dữ liệu: ' + (d.error || r.status), true);
      return false;
    }
    showToast('💾 Đã lưu dữ liệu!');
    return true;
  } catch (e) {
    showToast('Mất kết nối đến server!', true);
    return false;
  }
}

// ── DELETE MODAL ──
function confirmDelete(name, fn) {
  const nameEl = document.getElementById('del-modal-name');
  const btnEl = document.getElementById('del-confirm-btn');
  const modalEl = document.getElementById('del-modal');
  if (!nameEl || !btnEl || !modalEl) {
    // Fallback to native confirm if modal HTML not loaded
    if (confirm('Bạn có chắc muốn xóa ' + name + '?')) { fn(); }
    return;
  }
  nameEl.textContent = name;
  btnEl.onclick = () => { fn(); closeDelModal(); };
  modalEl.classList.add('open');
}
function closeDelModal() { const m = document.getElementById('del-modal'); if (m) m.classList.remove('open'); }

// ── NAVIGATION ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    const oc = n.getAttribute('onclick') || '';
    if (oc.includes("'" + id + "'") || oc.includes('"' + id + '"')) n.classList.add('active');
  });
  const map = { students: renderStudentTable, staff: renderStaffTable, dashboard: renderDashboard, revenue: renderRevenue, leads: renderLeadTable, classes: renderClassTable, 'class-detail':()=>{}, schedule: renderSchedule, attendance: initAttendancePage, makeup: renderMakeupTable, consult: initConsultPage, accounts: renderAccountsPage, 'staff-attendance': ()=>{ if(typeof renderStaffAttendancePage==='function') renderStaffAttendancePage(); }, 'student-portal': ()=>{ if(typeof renderStudentPortal==='function') renderStudentPortal(); }, audit: ()=>{ if(typeof renderAuditPage==='function') renderAuditPage(); }, zalo: ()=>{ if(typeof renderZaloConfig==='function') renderZaloConfig(); }, settings: ()=>{ if(typeof renderSettingsRoles==='function') renderSettingsRoles(); if(typeof renderSettingsCourses==='function') renderSettingsCourses(); } };
  if (map[id]) map[id]();
}
function startAddStudent() { editStudentId = null; clearStudentForm(); showPage('add-student'); }
// Auto end-date hook
setTimeout(function(){
  var fs=document.getElementById('f-start');
  var fp=document.getElementById('f-package');
  if(fs&&!fs._hooked){fs.addEventListener('change',function(){if(typeof autoCalcEndDate==='function')autoCalcEndDate();});fs._hooked=true;}
  if(fp&&!fp._hooked){fp.addEventListener('change',function(){
    if(typeof autoCalcEndDate==='function')autoCalcEndDate();
    const tInput = document.getElementById('f-totalSessions');
    if (tInput && fp.value) {
      const m = fp.value.match(/(\d+)\s*bu\u1ed5i/i);
      if (m) tInput.value = m[1];
    }
  });fp._hooked=true;}
},400);
function startAddClass()   { editClassId   = null; clearClassForm();   showPage('add-class'); }
function startAddStaff()   { editStaffId   = null; clearStaffForm();   showPage('add-staff'); }
function startAddLead()    { editLeadId    = null; clearLeadForm();    showPage('add-lead'); }

// ── COURSE DATA ──
const CD={
  piano:{name:'PIANO',emoji:'🎹',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  guitar:{name:'GUITAR',emoji:'🎸',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  violin:{name:'VIOLIN',emoji:'🎻',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  ukulele:{name:'UKULELE',emoji:'🪕',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  ve:{name:'VẼ',emoji:'🎨',sections:[{title:'Vẽ Mầm Non',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]},{title:'Vẽ Căn Bản',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3300000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1300000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1650000}]},{title:'Ký Họa / Màu Nước / Màu Marker',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]},{title:'Màu Acrylic / Digital Art',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:4800000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1800000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:2400000}]}]},
  ballet:{name:'BALLET',emoji:'🩰',sections:[{title:'Ballet 3–5 Tuổi',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]},{title:'Ballet 6–9 Tuổi',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]}]},
  dance:{name:'DANCE',emoji:'💃',sections:[{title:'Dance',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]}]},
  'khieuvũ':{name:'KHIÊU VŨ',emoji:'🕺',sections:[{title:'Khiêu Vũ',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3000000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1200000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1500000}]}]},
  muacotrang:{name:'MÚA CỔ TRANG',emoji:'👘',sections:[{title:'Múa Cổ Trang',rows:[{desc:'Lớp nhóm · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp nhóm · 1 tháng/8 buổi',amount:1400000},{desc:'Đóng 2 lần · 3 tháng/24 buổi',amount:1800000}]}]},
  thanhnhac:{name:'THANH NHẠC',emoji:'🎤',sections:[{title:'Căn Bản',rows:[{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  'luyen-thi':{name:'LUYỆN THI QUỐC TẾ',emoji:'🏆',sections:[{title:'Luyện Thi – Guitar',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000},{desc:'Luyện 3-1 · 1T/8b',amount:2200000},{desc:'Luyện 2-1 · 1T/8b',amount:3000000},{desc:'Luyện 1-1 · 1T/8b',amount:4200000}]},{title:'Luyện Thi – Violin',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000}]},{title:'Luyện Thi – Piano',rows:[{desc:'Luyện 3-1 · 3T/24b',amount:6000000},{desc:'Luyện 2-1 · 3T/24b',amount:8400000},{desc:'Luyện 1-1 · 3T/24b',amount:12000000}]},{title:'Luyện Thi – Vẽ',rows:[{desc:'Lớp nhóm · 3T/24b',amount:7200000},{desc:'Lớp nhóm · 1T/8b',amount:2600000},{desc:'Đóng 2 lần · 3T/24b',amount:3600000}]}]},
  hocthu:{name:'HỌC THỬ',emoji:'⭐',sections:[{title:'Các Loại Học Thử',rows:[{desc:'Học thử lớp nhóm',amount:100000},{desc:'Học thử 2-1',amount:250000},{desc:'Học thử 1-1',amount:500000}]}]},
  camthu:{name:'CẢM THỤ ÂM NHẠC',emoji:'🎼',sections:[{title:'Cảm Thụ Âm Nhạc Miễn Phí',rows:[{desc:'Lớp nhóm · 24 buổi · Miễn phí',amount:0}]}]},
  pianodemhat:{name:'PIANO ĐỆM HÁT',emoji:'🎹🎤',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  trong:{name:'TRỐNG',emoji:'🥁',sections:[{title:'Lớp Thông Thường',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:5400000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:7200000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:12000000},{desc:'Lớp 3-1 · 1 tháng/8 buổi',amount:2000000},{desc:'Lớp 2-1 · 1 tháng/8 buổi',amount:2600000},{desc:'Lớp 1-1 · 1 tháng/8 buổi',amount:4200000}]},{title:'Đóng 2 Lần (Ưu Đãi)',rows:[{desc:'Lớp 3-1 · 3 tháng/24 buổi',amount:2700000},{desc:'Lớp 2-1 · 3 tháng/24 buổi',amount:3600000},{desc:'Lớp 1-1 · 3 tháng/24 buổi',amount:6000000}]}]},
  khac:{name:'MỤC KHÁC',emoji:'🗂️',sections:[
    {title:'⭐ Học Thử',rows:[{desc:'Học thử lớp nhóm (10:1)',amount:100000},{desc:'Học thử 2-1',amount:250000},{desc:'Học thử 1-1',amount:500000}]},
    {title:'🩰 Đồ Ballet',rows:[{desc:'Đồ rời – Size 130(4bộ) · 140(2bộ) · 150(2bộ) · 160(1bộ) · 170(1bộ)',amount:300000},{desc:'Đồ liền',amount:200000}]},
    {title:'📚 Sách',rows:[{desc:'Sách Grade',amount:50000},{desc:'Sách Faber AVT (in VN: 250k / in Mỹ: 450k)',amount:60000},{desc:'Sách Guitar',amount:50000},{desc:'Sách người lớn',amount:100000}]},
    {title:'👟 Giày & Tất',rows:[{desc:'Giày 1 đôi lớn',amount:150000},{desc:'Giày 1 đôi bé cao cấp',amount:120000},{desc:'Giày 1 đôi bé thường',amount:60000},{desc:'Tất 1 đôi',amount:50000}]},
    {title:'🏠 Phòng Nhảy',rows:[{desc:'Phòng lớn Tầng 1 (không ML: 230k)',amount:300000},{desc:'Phòng nhỏ Tầng 2 (không ML: 200k)',amount:250000},{desc:'Thuê tháng từ 1 tháng',amount:5000000},{desc:'Thuê tháng từ 3 tháng',amount:4000000}]},
    {title:'🎹 Thuê Phòng Piano',rows:[{desc:'Theo giờ (check lịch trống)',amount:150000},{desc:'Gói 3 tháng – 2 buổi/tuần cố định',amount:3000000}]}
  ]}
};

function getAllCourses() {
  // Merge static CD + customCourses
  const all = {...CD};
  customCourses.forEach(c => { all[c.key] = c; });
  return all;
}

function openCourse(key){
  const allC = getAllCourses();
  const c = allC[key];
  if (!c) return;
  document.getElementById('modal-emoji').textContent = c.emoji;
  document.getElementById('modal-title').textContent = c.name;
  renderCourseModalContent(key, c);
  document.getElementById('course-modal').classList.add('open');
}

function renderCourseModalContent(key, c) {
  const prices = customPrices[key] || {};
  let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
    <button class="btn btn-outline" style="font-size:10px;padding:5px 12px;" onclick="toggleCourseEdit('${key}')">✏️ Chỉnh Sửa Học Phí</button>
  </div>`;
  c.sections.forEach((s,si)=>{
    html+=`<div class="price-section"><div class="price-section-title">${s.title}</div>`;
    s.rows.forEach((r,ri)=>{
      const priceKey = si+'_'+ri;
      const curAmount = prices[priceKey] !== undefined ? prices[priceKey] : r.amount;
      html+=`<div class="price-row">
        <div class="price-desc">${r.desc}</div>
        <div class="price-amount" id="pa_${key}_${priceKey}">${curAmount===0?'Miễn phí':fmt(curAmount)}</div>
        <input type="number" class="price-edit-input" id="pi_${key}_${priceKey}" value="${curAmount}" style="display:none;width:130px;padding:5px 8px;border:1.5px solid var(--gold);border-radius:8px;font-size:12px;font-weight:700;color:var(--navy);background:var(--cream);text-align:right;" min="0">
      </div>`;
    });
    html+='</div>';
  });
  html+=`<div id="course-edit-actions" style="display:none;margin-top:14px;padding-top:14px;border-top:1.5px solid var(--cream2);display:none;gap:9px;" class="form-actions">
    <button class="btn btn-gold" onclick="saveCourseEdit('${key}')">💾 Lưu Học Phí</button>
    <button class="btn btn-outline" onclick="resetCourseEdit('${key}')">↺ Khôi Phục Mặc Định</button>
  </div>`;
  document.getElementById('modal-content').innerHTML = html;
}

function toggleCourseEdit(key) {
  const inputs = document.querySelectorAll(`[id^="pi_${key}_"]`);
  const amounts = document.querySelectorAll(`[id^="pa_${key}_"]`);
  const actions = document.getElementById('course-edit-actions');
  const isEditing = inputs[0] && inputs[0].style.display !== 'none';
  inputs.forEach(el => el.style.display = isEditing ? 'none' : 'inline-block');
  amounts.forEach(el => el.style.display = isEditing ? '' : 'none');
  if (actions) actions.style.display = isEditing ? 'none' : 'flex';
}

function saveCourseEdit(key) {
  const allC = getAllCourses();
  const c = allC[key];
  if (!c) return;
  if (!customPrices[key]) customPrices[key] = {};
  c.sections.forEach((s,si) => {
    s.rows.forEach((r,ri) => {
      const priceKey = si+'_'+ri;
      const input = document.getElementById(`pi_${key}_${priceKey}`);
      if (input) customPrices[key][priceKey] = Number(input.value) || 0;
    });
  });
  save();
  renderCourseModalContent(key, c);
  showToast('Đã lưu học phí!');
}

function resetCourseEdit(key) {
  if (customPrices[key]) { delete customPrices[key]; save(); }
  const allC = getAllCourses();
  renderCourseModalContent(key, allC[key]);
  showToast('Đã khôi phục học phí mặc định!');
}

// ── PACKAGE OPTIONS PER COURSE ──
const COURSE_PACKAGES = {
  'Piano':                              ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','L\u1edbp 3-1 \u2013 1 n\u0103m/96 bu\u1ed5i','L\u1edbp 2-1 \u2013 1 n\u0103m/96 bu\u1ed5i','L\u1edbp 1-1 \u2013 1 n\u0103m/96 bu\u1ed5i'],
  'Guitar':                             ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Violin':                             ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Ukulele':                            ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Vẽ Mầm Non':                         ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ Căn Bản':                         ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ - Ký Họa / Màu Nước / Màu Marker':['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Vẽ - Màu Acrylic Canvas / Digital Art':['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Ballet (3-5 tuổi)':                  ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Ballet (6-9 tuổi)':                  ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Dance':                              ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Khiêu Vũ':                           ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Múa Cổ Trang':                       ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi','Lớp nhóm – 1 năm/96 buổi'],
  'Thanh Nhạc':                         ['Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Luyện Thi - Piano':                  ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi'],
  'Luyện Thi - Guitar':                 ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi','Luyện 3-1 · 1 tháng/8 buổi','Luyện 2-1 · 1 tháng/8 buổi','Luyện 1-1 · 1 tháng/8 buổi'],
  'Luyện Thi - Violin':                 ['Luyện 3-1 · 3 tháng/24 buổi','Luyện 2-1 · 3 tháng/24 buổi','Luyện 1-1 · 3 tháng/24 buổi'],
  'Luyện Thi - Vẽ':                     ['Lớp nhóm · 3 tháng/24 buổi','Lớp nhóm · 1 tháng/8 buổi','Đóng 2 lần · 3 tháng/24 buổi'],
  'Cảm Thụ Âm Nhạc':                   ['Miễn Phí · 24 buổi'],
  'Piano Đệm Hát':                      ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
  'Trống':                               ['Lớp 3-1 · 3 tháng/24 buổi','Lớp 2-1 · 3 tháng/24 buổi','Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 · 1 tháng/8 buổi','Lớp 2-1 · 1 tháng/8 buổi','Lớp 1-1 · 1 tháng/8 buổi','Đóng 2 lần – Lớp 3-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 2-1 · 3 tháng/24 buổi','Đóng 2 lần – Lớp 1-1 · 3 tháng/24 buổi','Lớp 3-1 – 1 năm/96 buổi','Lớp 2-1 – 1 năm/96 buổi','Lớp 1-1 – 1 năm/96 buổi'],
};

function populatePackages(selectedPkg) {
  const subj = document.getElementById('f-subject').value;
  const pkgSel = document.getElementById('f-package');
  const pkgs = COURSE_PACKAGES[subj] || [];
  pkgSel.innerHTML = pkgs.length
    ? '<option value="">-- Chọn gói --</option>' + pkgs.map(p => `<option${p===selectedPkg?' selected':''}>${p}</option>`).join('')
    : '<option value="">-- Chọn khóa học trước --</option>';
  // populate class dropdown
  const clSel = document.getElementById('f-classid');
  if (clSel) {
    const filtered = classes.filter(c => !subj || c.subject === subj);
    clSel.innerHTML = '<option value="">-- Chọn lớp (nếu có) --</option>'
      + filtered.map(c => `<option value="${c.id}">[${c.code}] ${c.name}</option>`).join('');
  }
}
function onClassSelect() {
  // tự động điền tên lớp nếu chọn
}

function setStudentClassFilter(f, el) {
  studentClassFilter = f;
  document.querySelectorAll('#filter-class-tabs .filter-tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderStudentTable();
}
function renderClassFilterBtns() {
  const wrap = document.getElementById('class-filter-btns');
  if (!wrap) return;
  const allActive = studentClassFilter==='all' ? ' active' : '';
  wrap.innerHTML = `<button class="filter-tab${allActive}" onclick="setStudentClassFilter('all',this)">Tất Cả</button>`
    + classes.map(c => `<button class="filter-tab${studentClassFilter===c.id?' active':''}" onclick="setStudentClassFilter('${c.id}',this)">[${c.code}] ${c.name}</button>`).join('');
}
function setStudentSubjectFilter(f, el) {
  studentSubjectFilter = f;
  document.querySelectorAll('#filter-subject-tabs .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderStudentTable();
}

function renderSubjectFilterBtns() {
  const wrap = document.getElementById('subject-filter-btns');
  if (!wrap) return;
  // Build full list: static + custom (dedup by name)
  const staticNames = new Set(STATIC_COURSES.map(c => c.name));
  const allTabs = [...STATIC_COURSES];
  customCourses.forEach(c => {
    if (!staticNames.has(c.name)) allTabs.push({name: c.name, emoji: c.emoji||'📚', match: c.name});
  });
  const allBtn = `<button class="filter-tab${studentSubjectFilter==='all'?' active':''}" onclick="setStudentSubjectFilter('all',this)">Tất Cả</button>`;
  const tabBtns = allTabs.map(c => {
    const active = (studentSubjectFilter === c.match || studentSubjectFilter === c.name) ? ' active' : '';
    return `<button class="filter-tab${active}" onclick="setStudentSubjectFilter('${c.match}',this)">${c.emoji} ${c.name}</button>`;
  }).join('');
  wrap.innerHTML = allBtn + tabBtns;
}

function closeCourse(){document.getElementById('course-modal').classList.remove('open');}
function closeCourseModal(e){if(e.target===document.getElementById('course-modal'))closeCourse();}

// ── STUDENTS ──
function saveStudent(){
  const g=id=>{const el=document.getElementById(id);return el?(el.value.trim?el.value.trim():el.value):'';};
  const name=g('f-name'),dob=g('f-dob'),parent=g('f-parent'),phone=g('f-phone'),
        subject=g('f-subject'),pkg=g('f-package'),totalSessions=Number(g('f-totalSessions'))||0,
        classid=Number(document.getElementById('f-classid')?document.getElementById('f-classid').value:'')||0,
        start=g('f-start'),end=g('f-end'), source=g('f-source'),
        payment=g('f-payment'),amount=g('f-amount'),paydate=g('f-paydate'),note=g('f-note');
  if(!name||!parent||!phone||!subject||!start||!payment){
    showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)',true);return;
  }
  const isEdit=editStudentId!==null;
  let finalVsId = isEdit ? (students.find(s=>s.id===editStudentId)||{}).vsId : null;
  if (!isEdit) {
    const maxHv = students.reduce((max, s) => Math.max(max, Number((s.vsId||'').replace('HV', '') || 0)), 0);
    finalVsId = `HV${String(maxHv + 1).padStart(4, '0')}`;
  }
  const obj={id:isEdit?editStudentId:Date.now(),vsId:finalVsId,name,dob,parent,phone,subject,pkg,
             totalSessions,classid,start,end,source,payment,amount:Number(amount)||0,paydate,note};
  if(isEdit){
    const i=students.findIndex(s=>s.id===editStudentId);
    if(i!==-1)students[i]=obj; else{showToast('Không tìm thấy học viên!',true);return;}
    editStudentId=null;
  } else students.push(obj);
  saveAsync().then(ok=>{
    if(ok){
      showToast(isEdit?'Đã cập nhật học viên thành công!':'Đã thêm học viên thành công!');
      if (!isEdit && typeof autoCreateStudentAccount === 'function') autoCreateStudentAccount(obj);
      const back=window._addStudentForClassId; clearStudentForm(); window._addStudentForClassId=null;
      if(!isEdit&&back) viewClassDetail(back); else showPage('students');
    } else { if(!isEdit) students.pop(); }
  });
}
function clearStudentForm(){
  ['f-name','f-dob','f-parent','f-phone','f-package','f-totalSessions','f-start','f-end','f-note','f-amount','f-paydate'].forEach(id=>document.getElementById(id).value='');
  ['f-subject','f-payment','f-source'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f-package').innerHTML='<option value="">-- Chọn khóa học trước --</option>';
  const clSel=document.getElementById('f-classid');if(clSel)clSel.innerHTML='<option value="">-- Chọn lớp (nếu có) --</option>';
  editStudentId=null; document.getElementById('form-title').innerHTML='Thêm <span>Học Viên</span>';
}
function editStudent(id){
  const s=students.find(x=>x.id===id); if(!s)return; editStudentId=id;
  document.getElementById('f-name').value=s.name;
  document.getElementById('f-dob').value=s.dob||'';
  document.getElementById('f-parent').value=s.parent;
  document.getElementById('f-phone').value=s.phone;
  document.getElementById('f-subject').value=s.subject;
  populatePackages(s.pkg||'');
  const clSel = document.getElementById('f-classid'); if(clSel && s.classid) { clSel.value = s.classid; }
  document.getElementById('f-start').value=s.start;
  const tsEl=document.getElementById('f-totalSessions'); if(tsEl) tsEl.value=s.totalSessions||'';
  document.getElementById('f-end').value=s.end||'';
  if(document.getElementById('f-source')) document.getElementById('f-source').value=s.source||'';
  document.getElementById('f-payment').value=s.payment;
  document.getElementById('f-amount').value=s.amount||'';
  document.getElementById('f-paydate').value=s.paydate||'';
  document.getElementById('f-note').value=s.note||'';
  document.getElementById('form-title').innerHTML='Chỉnh Sửa <span>Học Viên</span>';
  showPage('add-student');
}
function deleteStudent(id) {
  const s = students.find(x => x.id === id); if (!s) return;
  confirmDelete(s.name, () => {
    students = students.filter(x => x.id !== id);
    save(); renderStudentTable(); renderDashboard();
    showToast('Đã xóa học viên ' + s.name + '.');
  });
}
function setStudentFilter(f,el){
  studentFilter=f;
  document.querySelectorAll('#page-students .filter-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderStudentTable();
}

// Đếm buổi đã học của 1 học viên (từ điểm danh + bù lịch)
function countStudentSessions(studentId, classId) {
  let count = 0;
  attendance.forEach(a => {
    if (a.records && a.records[String(studentId)] === 'present') count++;
  });
  makeups.forEach(m => {
    if (String(m.studentId) === String(studentId) && m.status === 'done') count++;
  });
  return count;
}

function extractTotalSessions(pkg) {
  if (!pkg) return 0;
  const m = pkg.match(/(\d+)\s*buổi/);
  return m ? parseInt(m[1]) : 0;
}


function isExpiringSoon(s) {
  if (!s.end) return false;
  const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'}));
  const end = new Date(s.end);
  const d = Math.ceil((end - now) / (1000*60*60*24));
  return d >= 0 && d <= 14;
}
function renderExpiryBanner() {
  const el = document.getElementById('expiry-banner');
  if (!el) return;
  const exp = students.filter(s => isExpiringSoon(s) && s.subject !== 'Học Thử');
  if (!exp.length) { el.style.display='none'; return; }
  el.style.display='';
  el.innerHTML = '<span style="font-weight:700;color:#dc2626;">⏰ '
    + exp.length + ' học viên sắp hết khóa:</span> '
    + exp.map(s=>'<span style="font-weight:600">'+s.name+'</span>').join(', ');
}
function renderStudentTable(){
  renderClassFilterBtns();
  renderSubjectFilterBtns();
  renderExpiryBanner();
  const q=(document.getElementById('search-input').value||'').toLowerCase();
  const filtered=students.filter(s=>{
    const mq=!q||s.name.toLowerCase().includes(q)||s.phone.includes(q)||s.subject.toLowerCase().includes(q)||(s.parent&&s.parent.toLowerCase().includes(q));
    let mf=true;
    if(studentFilter==='hoc-thu') mf=s.subject==='Học Thử';
    else if(studentFilter==='sap-het-khoa') mf=isExpiringSoon(s)&&s.subject!=='Học Thử';
    else if(studentFilter!=='all') mf=s.payment===studentFilter;
    const mc=studentClassFilter==='all'||Number(s.classid)===Number(studentClassFilter);
    const ms=studentSubjectFilter==='all'||s.subject===studentSubjectFilter||(studentSubjectFilter==='Vẽ'&&s.subject&&s.subject.startsWith('Vẽ'))||(studentSubjectFilter==='Ballet'&&s.subject&&s.subject.startsWith('Ballet'))||(studentSubjectFilter==='Luyện Thi'&&s.subject&&s.subject.startsWith('Luyện Thi'));
    return mq&&mf&&ms&&mc;
  });
  const tbody=document.getElementById('student-table-body');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Không tìm thấy học viên nào</div></div></td></tr>`;return;}
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">✓ CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash">💵 TM</span>`:`<span class="badge badge-unpaid">⚠ Chưa TT</span>`;
  tbody.innerHTML=filtered.map((s,i)=>{
    const isHocThu = s.subject==='Học Thử';
    const expiring = isExpiringSoon(s)&&!isHocThu;
    const daysLeft = s.end ? Math.ceil((new Date(s.end)-new Date())/(1000*60*60*24)) : null;
    const expiryTag = expiring&&daysLeft!==null ? `<br><span style="font-size:10px;color:#dc2626;font-weight:700">⏰ còn ${daysLeft} ngày</span>` : '';
    const hocThuTag = isHocThu ? `<br><span style="font-size:10px;background:#fde047;color:#713f12;padding:1px 6px;border-radius:4px;font-weight:700">⭐ HỌC THỬ</span>` : '';
    const rowStyle = isHocThu?'background:linear-gradient(90deg,#fefce8,#fff);':expiring?'background:linear-gradient(90deg,#fff7ed,#fff);':'';
    // Tính buổi học
    const totalPkg = s.totalSessions || extractTotalSessions(s.pkg);
    const doneSessions = countStudentSessions(s.id, s.classid);
    const pct = totalPkg ? Math.min(100, Math.round(doneSessions/totalPkg*100)) : 0;
    const sessionColor = pct>=100?'#16a34a':pct>=60?'#d97706':'var(--navy)';
    const sessionCell = totalPkg
      ? `<div style="font-size:12px;font-weight:700;color:${sessionColor}">${doneSessions}/${totalPkg}</div>
         <div style="width:60px;height:5px;background:var(--cream2);border-radius:4px;margin-top:3px;overflow:hidden;">
           <div style="width:${pct}%;height:100%;background:${sessionColor};border-radius:4px;"></div>
         </div>`
      : `<span style="color:var(--muted);font-size:11px;">–</span>`;
    return `<tr style="${rowStyle}">
      <td style="text-align:center;font-size:11px;color:var(--muted);font-weight:600;">${i+1}</td>
      <td style="text-align:center"><span style="display:inline-block;background:var(--navy);color:var(--gold);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:800;white-space:nowrap;letter-spacing:.5px;min-width:52px;text-align:center;">${s.vsId||'–'}</span></td>
      <td class="td-name" style="font-weight:700;color:var(--navy)">${s.name}${hocThuTag}</td>
      <td>${fmtDate(s.dob)}</td>
      <td>${s.parent}</td>
      <td>${s.phone}</td>
      <td style="font-weight:600;color:var(--navy)">${s.subject}${s.pkg?`<br><span style="font-size:10px;color:var(--muted);font-weight:400">${s.pkg}</span>`:''}</td>
      <td>${(()=>{const cl=classes.find(c=>Number(c.id)===Number(s.classid));return cl?`<span class='pos-badge'>[${cl.code}]<br>${cl.name}</span>`:'–';})()}</td>
      <td style="font-size:11.5px">${fmtDate(s.start)}<br><span style="color:var(--muted)">→ ${fmtDate(s.end)}</span>${expiryTag}</td>
      <td>${pb(s.payment)}</td>
      <td style="font-weight:700;color:var(--gold)">${s.amount?fmt(s.amount):'–'}</td>
      <td style="text-align:center;">${sessionCell}</td>
      <td><div class="action-btns"><button class="btn-icon" onclick="if(typeof openStudentProfile==='function')openStudentProfile(${s.id})" title="Hồ Sơ HV" style="color:#3b82f6">👤</button><button class="btn-icon" onclick="if(typeof showPaymentHistory==='function')showPaymentHistory(${s.id})" title="Lịch Sử Thanh Toán" style="color:#22c55e">💳</button><button class="btn-icon" onclick="editStudent(${s.id})" title="Sửa">✎</button><button class="btn-icon" onclick="if(typeof showVietQR==='function')showVietQR(${s.id})" title="QR Thanh Toán" style="color:var(--gold)">⬡</button><button class="btn-icon" onclick="if(typeof openFeedbackModal==='function')openFeedbackModal(${s.id})" title="Nhận Xét GV" style="color:#22c55e">✍</button><button class="btn-icon del" onclick="deleteStudent(${s.id})" title="Xóa">✕</button></div></td>
    </tr>`;
  }).join('');
}

// ── STAFF ──
function saveStaff(){
  const g=id=>document.getElementById(id).value.trim?document.getElementById(id).value.trim():document.getElementById(id).value;
  const name=g('sf-name'),dob=g('sf-dob'),phone=g('sf-phone'),role=g('sf-role'),status=g('sf-status'),note=g('sf-note');
  if(!name||!phone||!role||!status){showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)',true);return;}
  let newStaffVsId = editStaffId ? (staff.find(s=>s.id===editStaffId)||{}).vsId : null;
  if (!newStaffVsId) {
    const maxNum = staff.reduce((max,s)=>{
      const m = s.vsId ? parseInt(s.vsId.replace('GV','')) : 0;
      return m > max ? m : max;
    }, 0);
    newStaffVsId = `GV${String(maxNum+1).padStart(4,'0')}`;
  }
  const obj={id:editStaffId||Date.now(),vsId:newStaffVsId,name,dob,phone,role,status,note};
  if(editStaffId!==null){const i=staff.findIndex(s=>s.id===editStaffId);if(i!==-1)staff[i]=obj;editStaffId=null;}
  else staff.push(obj);
  saveAsync().then(ok => {
    if (ok) { showToast('Đã lưu nhân sự thành công!'); clearStaffForm(); showPage('staff'); }
  });
}
function clearStaffForm(){
  ['sf-name','sf-dob','sf-phone','sf-note'].forEach(id=>document.getElementById(id).value='');
  ['sf-role','sf-status'].forEach(id=>document.getElementById(id).value='');
  editStaffId=null; document.getElementById('staff-form-title').innerHTML='Thêm <span>Nhân Sự</span>';
}
function editStaffMember(id){
  const s=staff.find(x=>x.id===id); if(!s)return; editStaffId=id;
  document.getElementById('sf-name').value=s.name;
  document.getElementById('sf-dob').value=s.dob||'';
  document.getElementById('sf-phone').value=s.phone;
  document.getElementById('sf-role').value=s.role;
  document.getElementById('sf-status').value=s.status;
  document.getElementById('sf-note').value=s.note||'';
  document.getElementById('staff-form-title').innerHTML='Chỉnh Sửa <span>Nhân Sự</span>';
  showPage('add-staff');
}
function deleteStaff(id) {
  const s = staff.find(x => x.id === id); if (!s) return;
  confirmDelete(s.name, () => {
    staff = staff.filter(x => x.id !== id);
    save(); renderStaffTable(); renderDashboard();
    showToast('Đã xóa nhân sự ' + s.name + '.');
  });
}
function setStaffFilter(f,el){staffFilter=f;document.querySelectorAll('#page-staff .filter-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderStaffTable();}

function renderStaffTable(){
  const q=(document.getElementById('staff-search').value||'').toLowerCase();
  const filtered=staff.filter(s=>{
    const mq=!q||s.name.toLowerCase().includes(q)||s.phone.includes(q)||s.role.toLowerCase().includes(q);
    let mf=true;
    if(staffFilter==='Giáo Viên') mf=s.role.startsWith('Giáo Viên');
    else if(staffFilter==='Nhân Viên') mf=!s.role.startsWith('Giáo Viên');
    else if(staffFilter!=='all') mf=s.status===staffFilter;
    return mq&&mf;
  });
  const tbody=document.getElementById('staff-table-body');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">Không tìm thấy nhân sự nào</div></div></td></tr>`;return;}
  tbody.innerHTML=filtered.map((s,i)=>`
    <tr>
      <td>${i+1}</td>
      <td style="font-weight:600;color:var(--navy);text-align:center;">${s.vsId||'—'}</td>
      <td class="td-name">${s.name}</td>
      <td>${fmtDate(s.dob)}</td>
      <td>${s.phone}</td>
      <td>${s.email||'—'}</td>
      <td>${s.bankName ? s.bankName + ' - ' + (s.bankAccount||'') : '—'}</td>
      <td><span class="pos-badge">${s.role}</span></td>
      <td>${s.status==='Đang hoạt động'?`<span class="badge badge-active">● Hoạt Động</span>`:`<span class="badge badge-offline">○ Offline</span>`}</td>
      <td><div class="action-btns"><button class="btn-icon" onclick="editStaffMember(${s.id})" title="Sửa">✎</button><button class="btn-icon del" onclick="deleteStaff(${s.id})" title="Xóa">✕</button></div></td>
    </tr>`).join('');
}

// ── LEADS ──
// Show/hide học thử fields based on status
function onLeadStatusChange() {
  const status = document.getElementById('lf-status').value;
  const isHocThu = status === 'Đăng ký học thử';
  ['lf-hocthu-wrap','lf-hocthu-fee-wrap','lf-dungcu-wrap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isHocThu ? '' : 'none';
  });
  if (isHocThu && !document.getElementById('lf-dungcu-rows').children.length) {
    // keep empty, user can add
  }
}

function addDungcuRow(name='', price=0) {
  const wrap = document.getElementById('lf-dungcu-rows');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = `
    <input type="text" class="search-box dc-name" placeholder="Tên dụng cụ (VD: Sách Grade)" value="${name}" style="flex:2;padding:7px 10px;font-size:12px;" oninput="calcDungcuTotal()">
    <input type="number" class="search-box dc-price" placeholder="Giá (đ)" value="${price||''}" min="0" style="flex:1;padding:7px 10px;font-size:12px;" oninput="calcDungcuTotal()">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove();calcDungcuTotal();" title="Xóa">✕</button>`;
  wrap.appendChild(div);
  calcDungcuTotal();
}

function calcDungcuTotal() {
  let total = 0;
  document.querySelectorAll('#lf-dungcu-rows .dc-price').forEach(el => {
    total += Number(el.value) || 0;
  });
  const t = document.getElementById('lf-dungcu-total');
  if (t) t.textContent = total.toLocaleString('vi-VN') + ' đ';
}

function getDungcuItems() {
  const items = [];
  document.querySelectorAll('#lf-dungcu-rows > div').forEach(div => {
    const name = div.querySelector('.dc-name').value.trim();
    const price = Number(div.querySelector('.dc-price').value) || 0;
    if (name) items.push({ name, price });
  });
  return items;
}

function saveLead() {
  const g = id => document.getElementById(id).value.trim ? document.getElementById(id).value.trim() : document.getElementById(id).value;
  const name=g('lf-name'),dob=g('lf-dob'),parent=g('lf-parent'),phone=g('lf-phone'),
        course=g('lf-course'),source=g('lf-source'),status=g('lf-status'),note=g('lf-note');
  if (!name||!parent||!phone||!course||!source||!status) { showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', true); return; }
  const existing = editLeadId ? (leads.find(l => l.id === editLeadId) || {}) : {};
  // Học thử
  const hocThuTypeSel = document.getElementById('lf-hocthu-type');
  const hocThuFeeSel  = document.getElementById('lf-hocthu-fee');
  const hocThuType = hocThuTypeSel ? hocThuTypeSel.options[hocThuTypeSel.selectedIndex]?.text || '' : '';
  const hocThuFee  = hocThuFeeSel  ? Number(hocThuFeeSel.value) || 0 : 0;
  // Dụng cụ
  const dungcu = getDungcuItems();
  const dungcuTotal = dungcu.reduce((a,i) => a+i.price, 0);
  const totalThu = hocThuFee + dungcuTotal;
  const obj = { id: editLeadId || Date.now(), name, dob, parent, phone, course, source, status, note,
    hocThuType, hocThuFee, dungcu, dungcuTotal, totalThu,
    createdAt: existing.createdAt || new Date().toISOString().slice(0,10) };
  if (editLeadId !== null) {
    const i = leads.findIndex(l => l.id === editLeadId);
    if (i !== -1) leads[i] = obj;
    editLeadId = null;
  } else leads.push(obj);
  saveAsync().then(ok => {
    if (ok) { showToast('Đã lưu học viên tiềm năng!'); clearLeadForm(); showPage('leads'); }
  });
}

function clearLeadForm() {
  ['lf-name','lf-dob','lf-parent','lf-phone','lf-note'].forEach(id => document.getElementById(id).value = '');
  ['lf-course','lf-source','lf-status'].forEach(id => document.getElementById(id).value = '');
  const ht = document.getElementById('lf-hocthu-type'); if(ht) ht.value='';
  const hf = document.getElementById('lf-hocthu-fee'); if(hf) hf.value='';
  const dr = document.getElementById('lf-dungcu-rows'); if(dr) dr.innerHTML='';
  ['lf-hocthu-wrap','lf-hocthu-fee-wrap','lf-dungcu-wrap'].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display='none';
  });
  editLeadId = null;
  document.getElementById('lead-form-title').innerHTML = 'Thêm <span>HV Tiềm Năng</span>';
}

function editLead(id) {
  const l = leads.find(x => x.id === id); if (!l) return;
  editLeadId = id;
  document.getElementById('lf-name').value   = l.name;
  document.getElementById('lf-dob').value    = l.dob||'';
  document.getElementById('lf-parent').value = l.parent;
  document.getElementById('lf-phone').value  = l.phone;
  document.getElementById('lf-course').value = l.course;
  document.getElementById('lf-source').value = l.source;
  document.getElementById('lf-status').value = l.status;
  document.getElementById('lf-note').value   = l.note||'';
  // Restore học thử
  onLeadStatusChange();
  const ht = document.getElementById('lf-hocthu-type'); if(ht && l.hocThuFee) ht.value = l.hocThuFee;
  const hf = document.getElementById('lf-hocthu-fee'); if(hf) hf.value = l.hocThuFee||'';
  // Restore dụng cụ
  const dr = document.getElementById('lf-dungcu-rows'); if(dr) dr.innerHTML='';
  (l.dungcu||[]).forEach(dc => addDungcuRow(dc.name, dc.price));
  document.getElementById('lead-form-title').innerHTML = 'Chỉnh Sửa <span>HV Tiềm Năng</span>';
  showPage('add-lead');
}

function deleteLead(id) {
  const l = leads.find(x => x.id === id); if (!l) return;
  confirmDelete(l.name, () => {
    leads = leads.filter(x => x.id !== id);
    save(); renderLeadTable(); renderDashboard();
    showToast('Đã xóa học viên tiềm năng ' + l.name + '.');
  });
}

function setLeadFilter(f, el) {
  leadFilter = f;
  document.querySelectorAll('#page-leads .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderLeadTable();
}

function renderLeadTable() {
  const q = (document.getElementById('lead-search').value || '').toLowerCase();
  const filtered = leads.filter(l => {
    const mq = !q || l.name.toLowerCase().includes(q) || (l.phone||'').includes(q) || (l.course||'').toLowerCase().includes(q) || (l.parent||'').toLowerCase().includes(q);
    const mf = leadFilter === 'all' || l.status === leadFilter || l.source === leadFilter;
    return mq && mf;
  });
  const tbody = document.getElementById('lead-table-body');
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">Không tìm thấy học viên tiềm năng nào</div></div></td></tr>`; return; }
  const srcBadge = s => {
    if (s === 'Facebook') return `<span class="badge badge-src-fb">📘 FB</span>`;
    if (s === 'Tiktok')   return `<span class="badge badge-src-tt">🎵 TT</span>`;
    return `<span class="badge badge-src-direct">🏠 TT</span>`;
  };
  const stBadge = s => {
    if (s === 'Đã tư vấn')        return `<span class="badge badge-consulted">✓ Đã TV</span>`;
    if (s === 'Đăng ký học thử')  return `<span class="badge" style="background:#fef9c3;color:#713f12;border:1.5px solid #fcd34d;">⭐ HT</span>`;
    if (s === 'Đã đăng ký học')   return `<span class="badge" style="background:#dcfce7;color:#15803d;border:1.5px solid #4ade80;">✅ ĐK</span>`;
    return `<span class="badge badge-new">○ Chưa LH</span>`;
  };
  tbody.innerHTML = filtered.map((l, i) => {
    const hocThuFmt = l.hocThuFee ? `<div style="font-size:11px;color:var(--navy);font-weight:600;">${l.hocThuType||'Học thử'}</div><div style="font-size:11px;color:var(--gold);font-weight:700;">${Number(l.hocThuFee).toLocaleString('vi-VN')} đ</div>` : '–';
    const dungcuFmt = (l.dungcu||[]).length
      ? `<div style="font-size:10.5px;color:var(--navy);">${l.dungcu.map(d=>`${d.name}: ${Number(d.price).toLocaleString('vi-VN')}đ`).join('<br>')}</div>`
      : '–';
    const totalFmt = (l.totalThu||0) > 0 ? `<span style="font-weight:800;color:var(--gold);">${Number(l.totalThu).toLocaleString('vi-VN')} đ</span>` : '–';
    return `<tr>
      <td>${i+1}</td>
      <td class="td-name">${l.name}</td>
      <td>${fmtDate(l.dob)}</td>
      <td>${l.parent}</td>
      <td>${l.phone}</td>
      <td style="font-weight:600;color:var(--navy)">${l.course}</td>
      <td>${srcBadge(l.source)}</td>
      <td>${stBadge(l.status)}</td>
      <td style="font-size:11px;color:var(--muted);max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${l.note||''}">${l.note||'–'}</td>
      <td>${hocThuFmt}</td>
      <td>${dungcuFmt}</td>
      <td>${totalFmt}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="editLead(${l.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteLead(${l.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── REVENUE ──
function initRevSelectors(){
  const mSel=document.getElementById('rev-month');
  const ySel=document.getElementById('rev-year');
  const months=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  if(!mSel.options.length){
    months.forEach((m,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=m;mSel.appendChild(o);});
    const curY=new Date().getFullYear();
    for(let y=curY-2;y<=curY+1;y++){const o=document.createElement('option');o.value=y;o.textContent=y;ySel.appendChild(o);}
  }
  const now=new Date();
  mSel.value=now.getMonth()+1;
  ySel.value=now.getFullYear();
}
function setRevToday(){const now=new Date();document.getElementById('rev-month').value=now.getMonth()+1;document.getElementById('rev-year').value=now.getFullYear();renderRevenue();}

function renderRevenue(){
  const m=parseInt(document.getElementById('rev-month').value);
  const y=parseInt(document.getElementById('rev-year').value);
  const paid=students.filter(s=>{
    if(!s.paydate||s.payment==='Chưa Thanh Toán')return false;
    const d=new Date(s.paydate);
    return d.getFullYear()===y&&(d.getMonth()+1)===m;
  });
  const unpaidMonth=students.filter(s=>{
    if(s.payment!=='Chưa Thanh Toán')return false;
    const d=new Date(s.start);
    return d.getFullYear()===y&&(d.getMonth()+1)===m;
  });
  // Thu từ leads (học thử + dụng cụ) trong tháng
  const paidLeads = leads.filter(l => {
    if (!l.totalThu || l.totalThu <= 0) return false;
    const d = new Date(l.createdAt||'');
    return d.getFullYear()===y && (d.getMonth()+1)===m;
  });
  const leadRevenue = paidLeads.reduce((a,l) => a + Number(l.totalThu||0), 0);

  const studentTotal = paid.reduce((a,s)=>a+Number(s.amount||0),0);
  const total = studentTotal + leadRevenue;

  document.getElementById('rev-total-value').textContent=fmt(total);
  document.getElementById('rev-total-count').textContent=paid.length + paidLeads.length;
  document.getElementById('rev-unpaid-count').textContent=unpaidMonth.length;

  const breakdown={};
  paid.forEach(s=>{
    const key=s.subject||'Khác';
    if(!breakdown[key])breakdown[key]={total:0,count:0};
    breakdown[key].total+=Number(s.amount||0);
    breakdown[key].count++;
  });
  if (leadRevenue > 0) {
    breakdown['Học Thử & Dụng Cụ'] = { total: leadRevenue, count: paidLeads.length };
  }
  const bEl=document.getElementById('rev-breakdown');
  const entries=Object.entries(breakdown).sort((a,b)=>b[1].total-a[1].total);
  bEl.innerHTML=entries.length?entries.map(([k,v])=>`
    <div class="rev-cat">
      <div class="rev-cat-name">${k}</div>
      <div class="rev-cat-amount">${fmt(v.total)}</div>
      <div class="rev-cat-count">${v.count} khoản</div>
    </div>`).join(''):'<p style="color:var(--muted);font-size:13px;padding:12px 0;">Không có dữ liệu trong tháng này.</p>';

  const tbody=document.getElementById('rev-table-body');
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">✓ CK</span>`:`<span class="badge badge-cash">💵 TM</span>`;
  const allRows = [
    ...paid.map((s,i)=>`<tr>
      <td>${i+1}</td>
      <td class="td-name">${s.name}</td>
      <td style="color:var(--navy);font-weight:600">${s.subject}</td>
      <td style="font-size:11px;color:var(--muted)">${s.pkg||'–'}</td>
      <td style="font-weight:800;color:var(--gold)">${fmt(s.amount)}</td>
      <td>${fmtDate(s.paydate)}</td>
      <td>${pb(s.payment)}</td>
    </tr>`),
    ...paidLeads.map((l,i)=>`<tr style="background:#fefce8;">
      <td>${paid.length+i+1}</td>
      <td class="td-name">${l.name}</td>
      <td style="color:var(--navy);font-weight:600">${l.hocThuType||'Học Thử/Dụng Cụ'}</td>
      <td style="font-size:11px;color:var(--muted)">${(l.dungcu||[]).map(d=>d.name).join(', ')||'–'}</td>
      <td style="font-weight:800;color:var(--gold)">${fmt(l.totalThu)}</td>
      <td>${fmtDate(l.createdAt)}</td>
      <td><span class="badge badge-cash">💵 Mục Khác</span></td>
    </tr>`),
  ];
  if(!allRows.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Chưa có khoản thu nào trong tháng này</div></div></td></tr>`;return;}
  tbody.innerHTML = allRows.join('');
}

// ── DASHBOARD ──
function renderDashboard(){
  document.getElementById('stat-total').textContent   = students.length;
  document.getElementById('stat-paid').textContent    = students.filter(s=>s.payment!=='Chưa Thanh Toán').length;
  document.getElementById('stat-unpaid').textContent  = students.filter(s=>s.payment==='Chưa Thanh Toán').length;
  document.getElementById('stat-staff').textContent   = staff.length;
  document.getElementById('stat-leads').textContent   = leads.length;
  const recent=[...students].reverse().slice(0,5);
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid" style="font-size:10px">✓ CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash" style="font-size:10px">TM</span>`:`<span class="badge badge-unpaid" style="font-size:10px">Chưa</span>`;
  const dtEl=document.getElementById('dashboard-table');
  dtEl.innerHTML=recent.length?recent.map(s=>`<tr><td class="td-name">${s.name}</td><td style="font-size:11.5px">${s.subject}</td><td>${pb(s.payment)}</td></tr>`).join(''):`<tr><td colspan="3"><div class="empty-state" style="padding:20px"><div class="empty-text">Chưa có học viên nào</div></div></td></tr>`;
  const now=new Date();
  const m=now.getMonth()+1,y=now.getFullYear();
  const paidM=students.filter(s=>{if(!s.paydate||s.payment==='Chưa Thanh Toán')return false;const d=new Date(s.paydate);return d.getFullYear()===y&&(d.getMonth()+1)===m;});
  const totalM=paidM.reduce((a,s)=>a+Number(s.amount||0),0);
  const expM = (typeof expenses !== 'undefined' ? expenses : []).filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  });
  const totalExpM = expM.reduce((a,e) => a + Number(e.amount||0), 0);
  
  const drs = document.getElementById('dash-revenue-summary'); if(drs) drs.innerHTML=`
    <div style="text-align:center;padding:20px 0;display:flex;justify-content:space-between;align-items:center;">
      <div style="flex:1;border-right:1px solid #eee;">
        <div style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;">TỔNG THU (${m}/${y})</div>
        <div style="font-size:24px;font-weight:800;color:var(--gold);letter-spacing:-1px">${fmt(totalM)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-weight:400;">từ ${paidM.length} học viên</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;">TỔNG CHI (${m}/${y})</div>
        <div style="font-size:24px;font-weight:800;color:#D94F4F;letter-spacing:-1px">${fmt(totalExpM)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-weight:400;">từ ${expM.length} khoản chi</div>
      </div>
    </div>`;
}

// ── XUẤT EXCEL ──
function exportExcel(type) {
  // Thử gọi server trước; nếu không có server thì xuất CSV trực tiếp từ browser
  const serverUrl = `/api/export/${type}`;

  fetch(serverUrl, { method: 'GET' })
    .then(res => {
      if (!res.ok) throw new Error('Server lỗi');
      return res.blob();
    })
    .then(blob => {
      const names = { students: 'HocVien', staff: 'NhanSu', leads: 'HVTiemNang', revenue: 'DoanhThu' };
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${names[type]}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất file Excel thành công!');
    })
    .catch(() => {
      // Fallback: xuất thẳng từ dữ liệu localStorage
      exportCSVLocal(type);
    });
}

function exportCSVLocal(type) {
  const BOM = '\uFEFF';
  const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '';
  const fmtNum  = n => Number(n || 0).toLocaleString('vi-VN');
  const q = v  => `"${String(v || '').replace(/"/g, '""')}"`;

  let csv = BOM;
  let filename = '';

  if (type === 'students') {
    filename = `HocVien_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Ngày Sinh','Phụ Huynh (Zalo)','SĐT','Môn Học','Gói / Lớp','Ngày BĐ','Ngày KT','Học Phí','Số Tiền (đ)','Ngày Nộp','Ghi Chú'].map(q).join(',') + '\n';
    students.forEach((s, i) => {
      csv += [i+1,s.name,fmtDate(s.dob),s.parent,s.phone,s.subject,s.pkg||'',fmtDate(s.start),fmtDate(s.end),s.payment,fmtNum(s.amount),fmtDate(s.paydate),s.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'staff') {
    filename = `NhanSu_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Ngày Sinh','SĐT','Vị Trí','Tình Trạng','Ghi Chú'].map(q).join(',') + '\n';
    staff.forEach((s, i) => {
      csv += [i+1,s.name,fmtDate(s.dob),s.phone,s.role,s.status,s.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'leads') {
    filename = `HVTiemNang_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên HV','Ngày Sinh','Phụ Huynh (Zalo)','SĐT','Khóa Học','Nguồn Data','Tình Trạng','Ghi Chú'].map(q).join(',') + '\n';
    leads.forEach((l, i) => {
      csv += [i+1,l.name,fmtDate(l.dob),l.parent,l.phone,l.course,l.source,l.status,l.note||''].map(q).join(',') + '\n';
    });
  } else if (type === 'revenue') {
    filename = `DoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    csv += ['#','Họ Tên','Môn Học','Gói / Lớp','Hình Thức','Số Tiền (đ)','Ngày Nộp'].map(q).join(',') + '\n';
    const paid = students.filter(s => s.payment !== 'Chưa Thanh Toán' && s.amount);
    paid.forEach((s, i) => {
      csv += [i+1,s.name,s.subject,s.pkg||'',s.payment,fmtNum(s.amount),fmtDate(s.paydate)].map(q).join(',') + '\n';
    });
    const total = paid.reduce((a, s) => a + Number(s.amount || 0), 0);
    csv += ['','','','',q('TỔNG'),q(fmtNum(total)),q('')].join(',') + '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất file Excel thành công!');
}


function showToast(msg,err){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.style.borderLeftColor=err?'var(--red)':'var(--gold)';
  t.className='toast show';
  setTimeout(()=>t.className='toast',3200);
}


// ── CLASSES ──
let editClassId = null;
const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];

function addScheduleRow(day, timeStart, timeEnd) {
  const list = document.getElementById('cl-schedule-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = `
    <select class="rev-month-select cl-day" style="flex:1">
      ${DAYS.map(d=>`<option${d===(day||'')?' selected':''}>${d}</option>`).join('')}
    </select>
    <input type="time" class="search-box cl-time-start" value="${timeStart||''}" style="flex:1;padding:8px 10px;" placeholder="Giờ bắt đầu" onchange="const dur = parseInt(document.getElementById('cl-duration')?.value || (document.getElementById('cl-subject')?.value?.toLowerCase().match(/vẽ|cảm thụ âm nhạc/) ? 90 : 60)); if(this.value && !this.nextElementSibling.value){ const [h,m]=this.value.split(':').map(Number); const d=new Date(); d.setHours(h,m+dur,0); this.nextElementSibling.value=d.toTimeString().slice(0,5); }">
    <input type="time" class="search-box cl-time-end" value="${timeEnd||''}" style="flex:1;padding:8px 10px;" placeholder="Giờ kết thúc">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove()" title="Xóa">✕</button>`;
  list.appendChild(div);
}

function getScheduleRows() {
  const rows = [];
  document.querySelectorAll('#cl-schedule-list > div').forEach(div => {
    const day   = div.querySelector('.cl-day').value;
    const start = div.querySelector('.cl-time-start').value;
    const end   = div.querySelector('.cl-time-end').value;
    if (day) rows.push({day, start, end});
  });
  return rows;
}

function saveClass() {
  const g = id => document.getElementById(id).value.trim();
  const code = g('cl-code'), name = g('cl-name'), subject = g('cl-subject'),
        teacher = g('cl-teacher'), room = g('cl-room'), note = g('cl-note');
  if (!code || !name || !subject) { showToast('Vui lòng điền Mã Lớp, Tên Lớp và Khóa Học (*)', true); return; }
  if (classes.find(c => c.code === code && c.id !== editClassId)) { showToast('Mã lớp đã tồn tại!', true); return; }
  const schedule = getScheduleRows();
  if (typeof window.checkScheduleConflict === 'function') {
      const conflictMsg = window.checkScheduleConflict(teacher, schedule, editClassId);
      if (conflictMsg) {
          if (!confirm('CẢNH BÁO TRÙNG LỊCH: ' + conflictMsg + '\\nBạn có CHẮC CHẮN muốn lưu?')) return;
      }
  }
  // Auto-sync teacher to staff
    if (teacher) {
      const existing = staff.find(s => s.name.toLowerCase() === teacher.toLowerCase());
      if (!existing) {
        const nextId = Date.now() + Math.floor(Math.random() * 1000);
        const newVsId = 'GV' + String(staff.length + 1).padStart(4, '0');
        const newStaff = { id: nextId, vsId: newVsId, name: teacher, dob: '', phone: '', role: 'Giáo Viên', status: 'Hoạt Động', note: 'Tự động tạo từ TKB' };
        staff.push(newStaff);
        autoCreateStaffAccount(newStaff);
      }
    }

    const isNew=editClassId===null;
  const obj={id:isNew?Date.now():editClassId,code,name,subject,teacher,room,duration:document.getElementById('cl-duration')?document.getElementById('cl-duration').value:60,note,schedule};
  if(!isNew){const i=classes.findIndex(c=>c.id===editClassId);if(i!==-1)classes[i]=obj;else{showToast('Không tìm thấy lớp!',true);return;}}
  else classes.push(obj);

  editClassId=null; const savedId=obj.id;
  saveAsync().then(ok=>{
    if(ok){
      if(isNew){showToast('Đã tạo lớp thành công!');viewClassDetail(savedId);}
      else{showToast('Đã cập nhật lớp thành công!');showPage('classes');}
    } else { if(isNew) classes.pop(); }
  });
}

function populateTeacherDropdown() { const sel = document.getElementById("cl-teacher"); if(!sel) return; const currentVal = sel.value; sel.innerHTML = '<option value="">-- Chọn giáo viên --</option>' + staff.map(s => `<option value="${s.name}">${s.name} - ${s.role}</option>`).join(''); sel.value = currentVal; }

function clearClassForm() {
  ['cl-code','cl-name','cl-teacher','cl-room','cl-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value = ''; });
  if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 60;
  populateTeacherDropdown();
  document.getElementById('cl-subject').value = '';
  document.getElementById('cl-schedule-list').innerHTML = '';
  editClassId = null;
  document.getElementById('class-form-title').innerHTML = 'Thêm <span>Lớp Học</span>';
}

window.autoFillDuration = function() {
  const subj = document.getElementById('cl-subject')?.value?.toLowerCase() || '';
  if (subj.includes('vẽ') || subj.includes('cảm thụ âm nhạc')) {
    if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 90;
  } else {
    if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = 60;
  }
};

function editClass(id) {
  const c = classes.find(x => x.id === id); if (!c) return;
  editClassId = id;
  document.getElementById('cl-code').value    = c.code;
  document.getElementById('cl-name').value    = c.name;
  document.getElementById('cl-subject').value = c.subject;
  populateTeacherDropdown();
  document.getElementById('cl-teacher').value = c.teacher || '';
  document.getElementById('cl-room').value    = c.room || '';
  if (document.getElementById('cl-duration')) document.getElementById('cl-duration').value = c.duration || 60;
  document.getElementById('cl-note').value    = c.note || '';
  document.getElementById('cl-schedule-list').innerHTML = '';
  (c.schedule || []).forEach(s => addScheduleRow(s.day, s.start, s.end));
  document.getElementById('class-form-title').innerHTML = 'Chỉnh Sửa <span>Lớp Học</span>';
  showPage('add-class');
}

function deleteClass(id) {
  const c = classes.find(x => x.id === id); if (!c) return;
  confirmDelete(c.name, () => {
    classes = classes.filter(x => x.id !== id);
    save(); renderClassTable(); renderDashboard();
    showToast('Đã xóa lớp ' + c.name + '.');
  });
}

function renderClassTable() {
  const q = (document.getElementById('class-search').value || '').toLowerCase();
  const filtered = classes.filter(c =>
    !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('class-table-body');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-text">Chưa có lớp nào</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((c, i) => {
    const hvCount = students.filter(s => Number(s.classid) === Number(c.id)).length;
    const sched = (c.schedule || []).map(s => `${s.day} ${s.start}–${s.end}`).join('<br>') || '–';
    return `<tr>
      <td>${i+1}</td>
      <td><span class="pos-badge">${c.code}</span></td>
      <td class="td-name">${c.name}</td>
      <td style="color:var(--navy);font-weight:600">${c.subject}</td>
      <td style="font-size:11.5px">${c.teacher||'–'}</td>
      <td style="font-size:11px;color:var(--muted)">${sched}</td>
      <td style="font-size:11.5px">${c.room||'–'}</td>
      <td style="font-weight:700;color:var(--navy)">${hvCount}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="viewClassDetail(${c.id})" title="Xem">👁</button>
        <button class="btn-icon" onclick="editClass(${c.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteClass(${c.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── SCHEDULE / TKB ──
let _tkbMode = 'simple'; // 'simple' | 'full'

function switchTKBTab(mode) {
  _tkbMode = mode;
  const s = document.getElementById('tkb-tab-simple');
  const f = document.getElementById('tkb-tab-full');
  if (s && f) {
    s.style.background = mode === 'simple' ? 'var(--gold)' : 'var(--cream2)';
    s.style.color      = mode === 'simple' ? '#1a1a1a' : 'var(--navy)';
    f.style.background = mode === 'full'   ? 'var(--gold)' : 'var(--cream2)';
    f.style.color      = mode === 'full'   ? '#1a1a1a' : 'var(--navy)';
  }
  renderSchedule();
}

function renderSchedule() {
  const filterSubj = document.getElementById('tkb-filter-subject')?.value || 'all';
  const filteredClasses = filterSubj === 'all' ? classes : classes.filter(c => c.subject === filterSubj);
  const dayOrder = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
  const grid = document.getElementById('schedule-grid');

  const slots = new Set();
  filteredClasses.forEach(c => (c.schedule||[]).forEach(s => { if (s.start) slots.add(s.start); }));
  const sortedSlots = [...slots].sort();

  if (!filteredClasses.length || !sortedSlots.length) {
    grid.innerHTML = '<div class="empty-state" style="padding:60px 0"><div class="empty-icon">📅</div><div class="empty-text">Chưa có lịch học nào.</div></div>';
    return;
  }

  const lookup = {};
  dayOrder.forEach(d => { lookup[d] = {}; });
  filteredClasses.forEach(c => {
    const classStudents = students.filter(s => Number(s.classid) === Number(c.id));
    (c.schedule||[]).forEach(s => {
      if (!s.day || !s.start) return;
      if (!lookup[s.day]) lookup[s.day] = {};
      if (!lookup[s.day][s.start]) lookup[s.day][s.start] = [];
      lookup[s.day][s.start].push({ cls: c, studs: classStudents, end: s.end });
    });
  });

  const isSimple = _tkbMode === 'simple';

  let html = `<div class="table-wrap"><table style="min-width:900px;border-collapse:collapse;">
    <thead><tr>
      <th style="width:80px;background:var(--navy);color:#fff;padding:10px 8px;font-size:12px;">Giờ</th>
      ${dayOrder.map(d => `<th style="background:var(--navy);color:#fff;padding:10px 8px;font-size:12px;">${d}</th>`).join('')}
    </tr></thead>
    <tbody>`;

  sortedSlots.forEach((slot, ri) => {
    const rowBg = ri % 2 === 0 ? '#fff' : '#fafafa';
    html += `<tr style="background:${rowBg}">`;
    html += `<td style="text-align:center;font-weight:800;font-size:13px;color:var(--navy);padding:8px 4px;border:1px solid #eee;white-space:nowrap;">${slot}</td>`;
    dayOrder.forEach(day => {
      const entries = (lookup[day]?.[slot]) || [];
      if (!entries.length) {
        html += `<td style="border:1px solid #eee;background:${rowBg}"></td>`;
      } else {
        html += `<td style="border:1px solid #eee;padding:4px;vertical-align:top;">`;
        entries.forEach(e => {
          const endStr = e.end ? `–${e.end}` : '';
          const subjectColor = {
            'Piano':'#3b82f6','Guitar':'#22c55e','Violin':'#a855f7','Dance':'#ef4444',
            'Ballet (3-5 tuổi)':'#ec4899','Ballet (6-9 tuổi)':'#f97316',
            'Vẽ Mầm Non':'#eab308','Vẽ Căn Bản':'#84cc16'
          }[e.cls.subject] || 'var(--navy)';

          if (isSimple) {
            // Dạng gọn: tên lớp + giờ + GV
            html += `<div style="background:${subjectColor}18;border-left:3px solid ${subjectColor};
              border-radius:0 6px 6px 0;padding:6px 8px;margin-bottom:4px;">
              <div style="font-weight:800;font-size:12px;color:${subjectColor};">${e.cls.name}</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">
                🕐 ${slot}${endStr}
              </div>
              ${e.cls.teacher ? `<div style="font-size:11px;color:#666;margin-top:1px;">👩‍🏫 ${e.cls.teacher}</div>` : ''}
              <div style="font-size:10px;color:#999;margin-top:1px;">${e.cls.subject} · ${e.studs.length} HV</div>
            </div>`;
          } else {
            // Dạng đầy đủ: + danh sách học viên
            const studsHtml = e.studs.length
              ? `<div style="margin-top:4px;border-top:1px dashed #eee;padding-top:4px;">
                  ${e.studs.map(s => `<div style="font-size:10px;color:#444;padding:1px 0;">• ${s.name}</div>`).join('')}
                 </div>`
              : `<div style="font-size:10px;color:#aaa;margin-top:3px;font-style:italic;">Chưa có HV</div>`;
            html += `<div style="background:${subjectColor}18;border-left:3px solid ${subjectColor};
              border-radius:0 6px 6px 0;padding:6px 8px;margin-bottom:4px;">
              <div style="font-weight:800;font-size:12px;color:${subjectColor};">${e.cls.name}</div>
              <div style="font-size:11px;color:#555;margin-top:2px;">🕐 ${slot}${endStr}</div>
              ${e.cls.teacher ? `<div style="font-size:11px;color:#666;margin-top:1px;">👩‍🏫 ${e.cls.teacher}</div>` : ''}
              <div style="font-size:10px;color:#888;margin-top:1px;">${e.cls.subject}</div>
              ${studsHtml}
            </div>`;
          }
        });
        html += `</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  grid.innerHTML = html;
}


// ── CUSTOM COURSES CRUD ──
let editCustomCourseKey = null;

function startAddCourse() {
  editCustomCourseKey = null;
  document.getElementById('cc-key').value = '';
  document.getElementById('cc-name').value = '';
  document.getElementById('cc-emoji').value = '';
  document.getElementById('cc-rows-wrap').innerHTML = '';
  addCustomCourseRow();
  document.getElementById('custom-course-modal').classList.add('open');
}

function editCustomCourse(key) {
  const c = customCourses.find(x => x.key === key);
  if (!c) return;
  editCustomCourseKey = key;
  document.getElementById('cc-key').value = key;
  document.getElementById('cc-name').value = c.name;
  document.getElementById('cc-emoji').value = c.emoji || '';
  const wrap = document.getElementById('cc-rows-wrap');
  wrap.innerHTML = '';
  (c.sections||[]).forEach(sec => {
    (sec.rows||[]).forEach(r => addCustomCourseRow(sec.title, r.desc, r.amount));
  });
  document.getElementById('custom-course-modal').classList.add('open');
}

function deleteCustomCourse(key) {
  const c = customCourses.find(x => x.key === key);
  if (!c) return;
  confirmDelete(c.name, () => {
    customCourses = customCourses.filter(x => x.key !== key);
    if (customPrices[key]) delete customPrices[key];
    save(); renderCoursesPage(); showToast('Đã xóa khóa học ' + c.name);
  });
}

function addCustomCourseRow(section, desc, amount) {
  const wrap = document.getElementById('cc-rows-wrap');
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:1fr 2fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px;';
  div.innerHTML = `
    <input type="text" class="search-box cc-section" placeholder="Tên nhóm gói" value="${section||''}" style="padding:8px 10px;font-size:12px;">
    <input type="text" class="search-box cc-desc" placeholder="Mô tả gói học" value="${desc||''}" style="padding:8px 10px;font-size:12px;">
    <input type="number" class="search-box cc-amount" placeholder="Học phí (đ)" value="${amount||0}" min="0" style="padding:8px 10px;font-size:12px;">
    <button type="button" class="btn-icon del" onclick="this.parentElement.remove()" title="Xóa">✕</button>`;
  wrap.appendChild(div);
}

function saveCustomCourse() {
  const key = document.getElementById('cc-key').value.trim().replace(/\s+/g,'_').toLowerCase();
  const name = document.getElementById('cc-name').value.trim();
  const emoji = document.getElementById('cc-emoji').value.trim() || '📚';
  if (!key || !name) { showToast('Vui lòng điền Mã khóa và Tên khóa học!', true); return; }
  if (!editCustomCourseKey && (CD[key] || customCourses.find(c=>c.key===key))) {
    showToast('Mã khóa học đã tồn tại!', true); return;
  }
  // Build sections from rows
  const rows = document.querySelectorAll('#cc-rows-wrap > div');
  const sectMap = {};
  rows.forEach(div => {
    const sec = div.querySelector('.cc-section').value.trim() || 'Học Phí';
    const desc = div.querySelector('.cc-desc').value.trim();
    const amount = Number(div.querySelector('.cc-amount').value) || 0;
    if (!desc) return;
    if (!sectMap[sec]) sectMap[sec] = [];
    sectMap[sec].push({desc, amount});
  });
  const sections = Object.entries(sectMap).map(([title, rows]) => ({title, rows}));
  if (!sections.length) { showToast('Vui lòng thêm ít nhất 1 gói học phí!', true); return; }
  const obj = {key, name, emoji, sections};
  // packages
  const pkgList = [];
  sections.forEach(s => s.rows.forEach(r => pkgList.push(r.desc)));
  if (editCustomCourseKey) {
    const i = customCourses.findIndex(c => c.key === editCustomCourseKey);
    if (i !== -1) customCourses[i] = obj;
  } else {
    customCourses.push(obj);
  }
  // update COURSE_PACKAGES dynamically
  COURSE_PACKAGES[name] = pkgList;
  save(); closeCustomCourseModal(); renderCoursesPage();
  showToast('Đã lưu khóa học ' + name + '!');
}

function closeCustomCourseModal() {
  document.getElementById('custom-course-modal').classList.remove('open');
  editCustomCourseKey = null;
}

function renderCoursesPage() {
  renderSubjectFilterBtns();
  // Re-render course cards including custom ones
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  // static cards are already in HTML, just append/re-render custom ones
  let customHtml = '';
  customCourses.forEach(c => {
    const totalPkg = c.sections ? c.sections.reduce((a,s)=>a+s.rows.length,0) : 0;
    customHtml += `<div class="course-card" onclick="openCourse('${c.key}')">
      <span class="course-emoji">${c.emoji||'📚'}</span>
      <div class="course-name">${c.name}</div>
      <div class="course-count">${totalPkg} gói học phí</div>
      <div style="display:flex;gap:5px;margin-top:8px;">
        <button class="btn-icon" onclick="event.stopPropagation();editCustomCourse('${c.key}')" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="event.stopPropagation();deleteCustomCourse('${c.key}')" title="Xóa">✕</button>
      </div>
    </div>`;
  });
  document.getElementById('custom-courses-container').innerHTML = customHtml;
  // Sync COURSE_PACKAGES for all custom
  customCourses.forEach(c => {
    const pkgList = [];
    (c.sections||[]).forEach(s => s.rows.forEach(r => pkgList.push(r.desc)));
    COURSE_PACKAGES[c.name] = pkgList;
  });
  // Sync f-subject selects
  syncCourseSelects();
}

function syncCourseSelects() {
  ['f-subject','cl-subject','lf-course','tkb-filter-subject'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    [...sel.querySelectorAll('option.custom-opt')].forEach(o => o.remove());
    customCourses.forEach(c => {
      const o = document.createElement('option');
      o.textContent = c.name;
      o.className = 'custom-opt';
      sel.appendChild(o);
    });
  });
}

// ── INIT (gọi sau khi đăng nhập xong) ──
initRevSelectors();

// ════════════════════════════════════════
// ── ĐIỂM DANH ──
// ════════════════════════════════════════
function initAttendancePage() {
  // Populate class dropdown
  const sel = document.getElementById('att-class');
  sel.innerHTML = '<option value="">-- Chọn lớp --</option>'
    + classes.map(c => `<option value="${c.id}">[${c.code}] ${c.name} – ${c.subject}</option>`).join('');
  // Default date = today
  const d = document.getElementById('att-date');
  if (!d.value) d.value = new Date().toISOString().slice(0,10);
  document.getElementById('att-content').innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">Chọn lớp và ngày rồi nhấn "Tải Danh Sách"</div></div>`;
}

function loadAttStudents() {
  const classId = document.getElementById('att-class').value;
  const date    = document.getElementById('att-date').value;
  const session = document.getElementById('att-session').value;
  if (!classId || !date) { showToast('Vui lòng chọn lớp và ngày học', true); return; }

  const cls = classes.find(c => String(c.id) === String(classId));
  const classStudents = students.filter(s => String(s.classid) === String(classId));
  if (!classStudents.length) {
    document.getElementById('att-content').innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">Lớp này chưa có học viên nào</div></div>`;
    return;
  }

  // Find existing attendance record for this class+date
  const existing = attendance.find(a => String(a.classId) === String(classId) && a.date === date);
  const records  = existing ? existing.records : {};

  // Extract total sessions from pkg string
}

let currentAttRecords = {};
function setAtt(studentId, status, btn) {
  currentAttRecords[studentId] = status;
  // Update button styles
  const row = document.getElementById('att-row-'+studentId);
  row.querySelectorAll('.att-radio-btn').forEach(b => {
    b.classList.remove('present','absent-ex','absent-no');
  });
  const cls = status==='present'?'present':status==='absent-ex'?'absent-ex':'absent-no';
  btn.classList.add(cls);
}

function saveAttendance(classId, date) {
  const rows = document.querySelectorAll('[id^="att-row-"]');
  const records = {};
  rows.forEach(row => {
    const sid = row.id.replace('att-row-','');
    const active = row.querySelector('.att-radio-btn.present,.att-radio-btn.absent-ex,.att-radio-btn.absent-no');
    if (active) {
      records[sid] = active.classList.contains('present') ? 'present'
        : active.classList.contains('absent-ex') ? 'absent-ex' : 'absent-no';
    }
  });

  const idx = attendance.findIndex(a => String(a.classId)===String(classId) && a.date===date);
  const session = document.getElementById('att-session').value;
  const obj = { id: Date.now(), classId, date, session: Number(session)||0, records };
  if (idx !== -1) attendance[idx] = { ...attendance[idx], ...obj };
  else attendance.push(obj);

  // Auto-create makeup for absent-ex
  Object.entries(records).forEach(([sid, status]) => {
    if (status === 'absent-ex') {
      const alreadyExists = makeups.find(m => m.studentId === Number(sid) && m.absentDate === date);
      if (!alreadyExists) {
        const st = students.find(s => String(s.id) === String(sid));
        makeups.push({
          id: Date.now() + Math.random(),
          studentId: Number(sid),
          studentName: st ? st.name : '',
          classId,
          absentDate: date,
          absentType: 'Vắng có phép',
          makeupDate: '',
          status: 'pending',
          note: 'Tự động tạo từ điểm danh'
        });
      }
    }
  });

  save();
  showToast('Đã lưu điểm danh thành công!');
  loadAttStudents();
}

// ════════════════════════════════════════
// ── BÙ LỊCH ──
// ════════════════════════════════════════
function initMakeupSelects() {
  const sel = document.getElementById('mk-student');
  if (sel) {
    sel.innerHTML = '<option value="">-- Chọn học viên --</option>'
      + students.map(s => `<option value="${s.id}">${s.name} – ${s.subject}</option>`).join('');
  }
  const csel = document.getElementById('mk-class');
  if (csel) {
    csel.innerHTML = '<option value="">-- Chọn lớp --</option>'
      + classes.map(c => `<option value="${c.id}">[${c.code}] ${c.name}</option>`).join('');
  }
}

function setMakeupFilter(f, el) {
  makeupFilter = f;
  document.querySelectorAll('#page-makeup .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderMakeupTable();
}

function renderMakeupTable() {
  const q = (document.getElementById('makeup-search').value||'').toLowerCase();
  const filtered = makeups.filter(m => {
    const mq = !q || (m.studentName||'').toLowerCase().includes(q);
    const mf = makeupFilter==='all' || (makeupFilter==='pending'&&m.status==='pending') || (makeupFilter==='done'&&m.status==='done');
    return mq && mf;
  });
  // Stats
  document.getElementById('mk-total').textContent   = makeups.length;
  document.getElementById('mk-pending').textContent = makeups.filter(m=>m.status==='pending').length;
  document.getElementById('mk-done').textContent    = makeups.filter(m=>m.status==='done').length;

  const tbody = document.getElementById('makeup-table-body');
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🔄</div><div class="empty-text">Không có buổi bù nào</div></div></td></tr>`; return; }
  tbody.innerHTML = filtered.map((m,i) => {
    const cls = classes.find(c => String(c.id)===String(m.classId));
    const statusBadge = m.status==='done'
      ? `<span class="badge badge-paid">✅ Đã Bù</span>`
      : `<span class="badge badge-unpaid">⏳ Chưa Bù</span>`;
    const typeBadge = m.absentType==='Vắng có phép'
      ? `<span class="badge" style="background:#fff7ed;color:#92400e;border:1.5px solid #f59e0b;">📋 Có Phép</span>`
      : `<span class="badge" style="background:#fef2f2;color:#dc2626;border:1.5px solid #f87171;">❌ Không Phép</span>`;
    return `<tr>
      <td>${i+1}</td>
      <td class="td-name">${m.studentName||'–'}</td>
      <td>${cls?`<span class="pos-badge">[${cls.code}]</span>`:'–'}</td>
      <td style="font-size:11.5px;">${fmtDate(m.absentDate)}</td>
      <td>${typeBadge}</td>
      <td style="font-size:11.5px;">${m.makeupDate?fmtDate(m.makeupDate):'<span style="color:var(--muted)">Chưa xếp</span>'}</td>
      <td>${statusBadge}</td>
      <td style="font-size:11px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.note||''}">${m.note||'–'}</td>
      <td><div class="action-btns">
        ${m.status==='pending'?`<button class="btn-icon" onclick="markMakeupDone(${m.id})" title="Đánh dấu đã bù" style="color:#16a34a;border-color:#4ade80;">✓</button>`:''}
        <button class="btn-icon" onclick="editMakeup(${m.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="deleteMakeup(${m.id})" title="Xóa">✕</button>
      </div></td>
    </tr>`;
  }).join('');
}

function markMakeupDone(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  m.status = 'done';
  if (!m.makeupDate) m.makeupDate = new Date().toISOString().slice(0,10);
  save(); renderMakeupTable(); showToast('Đã đánh dấu buổi bù hoàn thành!');
}

function openAddMakeup() {
  editMakeupId = null;
  initMakeupSelects();
  document.getElementById('mk-absent-date').value = '';
  document.getElementById('mk-makeup-date').value = '';
  document.getElementById('mk-absent-type').value = '';
  document.getElementById('mk-status').value = 'pending';
  document.getElementById('mk-note').value = '';
  document.getElementById('makeup-modal-title').textContent = 'Thêm Buổi Bù';
  document.getElementById('makeup-modal').classList.add('open');
}

function editMakeup(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  editMakeupId = id;
  initMakeupSelects();
  document.getElementById('mk-student').value     = m.studentId||'';
  document.getElementById('mk-class').value       = m.classId||'';
  document.getElementById('mk-absent-date').value = m.absentDate||'';
  document.getElementById('mk-absent-type').value = m.absentType||'';
  document.getElementById('mk-makeup-date').value = m.makeupDate||'';
  document.getElementById('mk-status').value      = m.status||'pending';
  document.getElementById('mk-note').value        = m.note||'';
  document.getElementById('makeup-modal-title').textContent = 'Sửa Buổi Bù';
  document.getElementById('makeup-modal').classList.add('open');
}

function saveMakeup() {
  const studentId   = Number(document.getElementById('mk-student').value);
  const classId     = document.getElementById('mk-class').value;
  const absentDate  = document.getElementById('mk-absent-date').value;
  const absentType  = document.getElementById('mk-absent-type').value;
  const makeupDate  = document.getElementById('mk-makeup-date').value;
  const status      = document.getElementById('mk-status').value;
  const note        = document.getElementById('mk-note').value.trim();
  if (!studentId || !absentDate || !absentType) { showToast('Vui lòng điền đầy đủ thông tin bắt buộc', true); return; }
  const st = students.find(s => s.id===studentId);
  const obj = { id: editMakeupId||Date.now(), studentId, studentName: st?st.name:'', classId, absentDate, absentType, makeupDate, status, note };
  if (editMakeupId) {
    const i = makeups.findIndex(m => m.id===editMakeupId);
    if (i!==-1) makeups[i] = obj;
    editMakeupId = null;
  } else makeups.push(obj);
  save(); closeMakeupModal(); renderMakeupTable(); showToast('Đã lưu buổi bù!');
}

function deleteMakeup(id) {
  const m = makeups.find(x => x.id===id); if(!m) return;
  confirmDelete(m.studentName+' ('+fmtDate(m.absentDate)+')', () => {
    makeups = makeups.filter(x => x.id!==id);
    save(); renderMakeupTable(); showToast('Đã xóa buổi bù.');
  });
}

function closeMakeupModal() { document.getElementById('makeup-modal').classList.remove('open'); }

// ════════════════════════════════════════
// ── TƯ VẤN & TIN NHẮN MẪU ──
// ════════════════════════════════════════
function initConsultPage() {
  setConsultTab(consultTab, null);
  renderTemplates();
}

function setConsultTab(tab, el) {
  consultTab = tab;
  document.querySelectorAll('#page-consult .filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    document.querySelectorAll('#page-consult .filter-tab').forEach(t => {
      if ((t.textContent||'').includes(tab==='process'?'Quy Trình':'Tin Nhắn')) t.classList.add('active');
    });
  }
  ['process','templates'].forEach(t => {
    const el = document.getElementById('consult-tab-'+t);
    if (el) el.style.display = t===tab ? '' : 'none';
  });
  if (tab==='templates') renderTemplates();
}

function generateGroupMsg() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const course = document.getElementById('cf-course').value.trim();
  const note   = document.getElementById('cf-note').value.trim();
  if (!name) { showToast('Vui lòng nhập tên học viên', true); return; }
  const now = new Date();
  const timeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  const text = `KH MỚI – ${timeStr}\n${'─'.repeat(30)}\nHọc Viên  : ${name}\nĐộ Tuổi   : ${age||'–'}\nPH Zalo   : ${parent||'–'}\nMôn Học   : ${course||'–'}\nGhi Chú   : ${note||'–'}\n${'─'.repeat(30)}\nTrạng Thái: Đang tư vấn`;
  document.getElementById('cf-output').textContent = text;
  document.getElementById('cf-output-wrap').style.display = 'block';
}

function copyGroupMsg() {
  const text = document.getElementById('cf-output').textContent;
  navigator.clipboard.writeText(text).then(()=>{}).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);});
  const cf = document.getElementById('cf-copied');
  cf.style.display='block'; setTimeout(()=>cf.style.display='none',3000);
}

let activeCourseGroup = null;

function renderTemplates() {
  const q = (document.getElementById('template-search')||{value:''}).value.toLowerCase();
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  // Build groups
  const groups = {};
  templates.forEach(t => {
    if (!groups[t.course]) groups[t.course] = { emoji: t.emoji||'💬', items: [] };
    groups[t.course].items.push(t);
  });

  // Filter by search
  const filteredGroups = {};
  Object.entries(groups).forEach(([course, g]) => {
    const matchGroup = !q || course.toLowerCase().includes(q);
    const matchItems = g.items.filter(t => !q || t.content.toLowerCase().includes(q) || course.toLowerCase().includes(q));
    if (matchGroup || matchItems.length) {
      filteredGroups[course] = { ...g, items: matchGroup ? g.items : matchItems };
    }
  });

  if (!Object.keys(filteredGroups).length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:40px;"><div class="empty-icon">💬</div><div class="empty-text">Chưa có tin nhắn mẫu nào.<br>Nhấn "+ Thêm Tin Nhắn Mẫu" để tạo mới.</div></div>`;
    return;
  }

  // If search active, show all flat
  if (q) {
    activeCourseGroup = null;
    let html = `<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">`;
    Object.entries(filteredGroups).forEach(([course, g]) => {
      g.items.forEach(t => {
        html += buildTemplateCard(t);
      });
    });
    html += '</div>';
    grid.innerHTML = html;
    return;
  }

  // Level 1: môn tabs (if no group selected)
  if (!activeCourseGroup || !filteredGroups[activeCourseGroup]) {
    activeCourseGroup = null;
    grid.innerHTML = `
      <div style="grid-column:1/-1;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
          ${Object.entries(filteredGroups).map(([course, g]) => `
            <button onclick="selectCourseGroup('${course.replace(/'/g,"\\'")}');"
              style="display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid rgba(200,146,42,.15);border-radius:12px;padding:10px 16px;cursor:pointer;transition:all .2s;font-family:'Be Vietnam Pro',sans-serif;min-width:160px;"
              onmouseover="this.style.borderColor='var(--gold)';this.style.background='var(--cream)';"
              onmouseout="this.style.borderColor='rgba(200,146,42,.15)';this.style.background='var(--white)';">
              <span style="font-size:22px;">${g.emoji}</span>
              <div style="text-align:left;">
                <div style="font-size:12px;font-weight:800;color:var(--navy);">${course}</div>
                <div style="font-size:10px;color:var(--muted);">${g.items.length} tin nhắn mẫu</div>
              </div>
              <span style="margin-left:auto;color:var(--gold);font-size:16px;">›</span>
            </button>`).join('')}
          <button onclick="openAddTemplate();" style="display:flex;align-items:center;gap:8px;background:var(--cream);border:1.5px dashed var(--gold);border-radius:12px;padding:10px 16px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;min-width:160px;color:var(--gold);font-weight:700;font-size:12px;">
            <span style="font-size:22px;">＋</span> Thêm Mẫu Mới
          </button>
        </div>
      </div>`;
    return;
  }

  // Level 2: cards in selected group
  const g = filteredGroups[activeCourseGroup];
  grid.innerHTML = `
    <div style="grid-column:1/-1;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <button onclick="activeCourseGroup=null;renderTemplates();" style="background:var(--cream);border:1.5px solid var(--cream2);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:var(--navy);font-family:'Be Vietnam Pro',sans-serif;">← Quay lại</button>
        <span style="font-size:22px;">${g.emoji}</span>
        <div style="font-size:16px;font-weight:800;color:var(--navy);">${activeCourseGroup}</div>
        <button onclick="openAddTemplate('${activeCourseGroup.replace(/'/g,"\\'")}');" style="margin-left:auto;background:var(--gold);color:#fff;border:none;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:11px;font-weight:700;font-family:'Be Vietnam Pro',sans-serif;">+ Thêm mẫu</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">
        ${g.items.map(t => buildTemplateCard(t)).join('')}
      </div>
    </div>`;
}

function buildTemplateCard(t) {
  const preview = t.content.length > 120 ? t.content.slice(0, 120) + '…' : t.content;
  return `<div style="background:var(--white);border-radius:12px;border:1.5px solid rgba(200,146,42,.12);box-shadow:var(--shadow-sm);overflow:hidden;display:flex;flex-direction:column;">
    <div style="background:var(--navy);padding:10px 14px;">
      <div style="font-size:11px;font-weight:800;color:var(--gold);letter-spacing:.5px;">${t.course}</div>
    </div>
    <div style="padding:12px 14px;flex:1;">
      <div style="background:var(--cream);border-radius:8px;padding:10px;font-size:11.5px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;font-family:'Be Vietnam Pro',sans-serif;max-height:180px;overflow-y:auto;">${t.content}</div>
    </div>
    <div style="padding:10px 14px 12px;display:flex;gap:7px;border-top:1px solid var(--cream2);">
      <button onclick="copyTemplate(${t.id})" style="background:var(--gold);color:#fff;border:none;border-radius:8px;padding:7px 0;font-size:11px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;flex:1;">📋 Sao Chép</button>
      <button onclick="editTemplate(${t.id})" style="background:var(--white);border:1.5px solid var(--cream2);color:var(--navy);border-radius:8px;padding:7px 11px;font-size:13px;cursor:pointer;" title="Sửa">✎</button>
      <button onclick="deleteTemplate(${t.id})" style="background:#fff5f5;border:1.5px solid #fca5a5;color:#dc2626;border-radius:8px;padding:7px 11px;font-size:14px;cursor:pointer;" title="Xóa">🗑</button>
    </div>
  </div>`;
}

function selectCourseGroup(course) {
  activeCourseGroup = course;
  renderTemplates();
}

function copyTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  navigator.clipboard.writeText(t.content).then(() => showToast('Đã sao chép tin nhắn! Dán vào Zalo ngay.')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value=t.content; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Đã sao chép!');
  });
}

function openAddTemplate(prefillCourse) {
  editTemplateId = null;
  document.getElementById('tpl-course').value  = prefillCourse || '';
  document.getElementById('tpl-emoji').value   = '';
  document.getElementById('tpl-content').value = '';
  document.getElementById('template-modal-title').textContent = 'Thêm Tin Nhắn Mẫu';
  document.getElementById('template-modal').classList.add('open');
}

function editTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  editTemplateId = id;
  document.getElementById('tpl-course').value  = t.course;
  document.getElementById('tpl-emoji').value   = t.emoji||'';
  document.getElementById('tpl-content').value = t.content;
  document.getElementById('template-modal-title').textContent = 'Sửa Tin Nhắn Mẫu';
  document.getElementById('template-modal').classList.add('open');
}

function saveTemplate() {
  const course  = document.getElementById('tpl-course').value.trim();
  const emoji   = document.getElementById('tpl-emoji').value.trim() || '💬';
  const content = document.getElementById('tpl-content').value.trim();
  if (!course || !content) { showToast('Vui lòng điền tên môn và nội dung', true); return; }
  const obj = { id: editTemplateId||Date.now(), course, emoji, content };
  if (editTemplateId) {
    const i = templates.findIndex(t => t.id===editTemplateId);
    if (i!==-1) templates[i] = obj;
    editTemplateId = null;
  } else templates.push(obj);
  save(); closeTemplateModal(); renderTemplates(); showToast('Đã lưu tin nhắn mẫu!');
}

function deleteTemplate(id) {
  const t = templates.find(x => x.id===id); if(!t) return;
  confirmDelete(t.course, () => {
    templates = templates.filter(x => x.id!==id);
    save(); renderTemplates(); showToast('Đã xóa tin nhắn mẫu.');
  });
}

function closeTemplateModal() { document.getElementById('template-modal').classList.remove('open'); }

// Form thu thập thông tin tư vấn
function copyConsultForm() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const phone  = document.getElementById('cf-phone').value.trim();
  const course = document.getElementById('cf-course').value;
  const note   = document.getElementById('cf-note').value.trim();
  if (!name||!parent||!phone) { showToast('Vui lòng điền đủ tên HV, tên PH và SĐT', true); return; }
  const text = `HV MỚI 🎵\n- Tên HV: ${name}${age?' ('+age+')':''}\n- Phụ huynh: ${parent}\n- SĐT: ${phone}${course?'\n- Môn quan tâm: '+course:''}${note?'\n- Lưu ý: '+note:''}`;
  navigator.clipboard.writeText(text).then(() => {}).catch(()=>{ const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); });
  const cf = document.getElementById('cf-copied');
  cf.style.display='block'; setTimeout(()=>cf.style.display='none',3000);
}

function saveLeadFromForm() {
  const name   = document.getElementById('cf-name').value.trim();
  const age    = document.getElementById('cf-age').value.trim();
  const parent = document.getElementById('cf-parent').value.trim();
  const course = document.getElementById('cf-course').value.trim();
  const note   = document.getElementById('cf-note').value.trim();
  if (!name||!parent) { showToast('Vui lòng điền tên HV và tên phụ huynh', true); return; }
  leads.push({ id: Date.now(), name, dob:'', parent, phone:'', course: course||'Chưa xác định', source:'Trực tiếp', status:'Đã tư vấn', note: (age?'Độ tuổi: '+age+'. ':'')+(note||''), createdAt: new Date().toISOString().slice(0,10) });
  save(); clearConsultForm(); showToast('Đã lưu vào HV Tiềm Năng!');
}

function clearConsultForm() {
  ['cf-name','cf-age','cf-parent','cf-course','cf-note'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const wrap = document.getElementById('cf-output-wrap');
  if (wrap) wrap.style.display='none';
}

function copyGroupTemplate() {
  const text = 'HV MỚI 🎵\n- Tên HV: [Tên học viên]\n- Độ tuổi: [Tuổi]\n- Phụ huynh: [Tên PH]\n- SĐT: [Số điện thoại]\n- Môn quan tâm: [Môn học]\n- Lưu ý: [Ghi chú thêm]';
  navigator.clipboard.writeText(text).then(()=>showToast('Đã sao chép mẫu gửi nhóm!')).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('Đã sao chép!');});
}

// Backup / Restore
function exportBackup() {
  const data = { students, staff, leads, classes, attendance, makeups, templates, customCourses, customPrices };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`vinsoul_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  showToast('Đã tải file backup!');
}

function importBackup() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange = e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.students) students = data.students;
        if (data.staff)    staff    = data.staff;
        if (data.leads)    leads    = data.leads;
        if (data.classes)  classes  = data.classes;
        if (data.attendance) attendance = data.attendance;
        if (data.makeups)    makeups    = data.makeups;
        if (data.templates)  templates  = data.templates;
        if (data.customCourses) customCourses = data.customCourses;
        if (data.customPrices)  customPrices  = data.customPrices;
    if (data.staffRoles) staffRoles = data.staffRoles;
    populateDynamicSelects();
    renderSettingsRoles();
    if (data.expenses)      expenses      = data.expenses;
        saveAsync().then(ok => { if (ok) { renderDashboard(); renderCoursesPage(); showToast('Khôi phục dữ liệu thành công!'); } });
      } catch { showToast('File backup không hợp lệ!', true); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── SEED TIN NHẮN MẪU (từ data chính thức) ──
function seedTemplatesIfEmpty() {
  if (templates.length > 0) return;
  const N = 'Anh/chị có thể tham gia buổi học trải nghiệm trước khi đăng ký lớp chính thức ạ.';
  const N5 = 'Anh/chị có thể tham gia buổi học trải nghiệm (500.000đ) trước khi đăng ký lớp chính thức ạ.';
  const N1 = 'Anh/chị có thể tham gia buổi học trải nghiệm (100.000đ) trước khi đăng ký lớp chính thức ạ.';

  function mk(course, emoji, items) {
    return items.map(([title, fee, time, buoi, freq, dong2, noi_dung, after, note]) => ({
      id: Date.now() + Math.random(),
      course, emoji,
      content: `${title}\n💰 Học phí: ${fee}\n⏱ Thời lượng: ${time} (${buoi})\n📅 Tần suất: ${freq}${dong2 ? '\n💳 Đóng 2 lần: ' + dong2 : ''}\n\n📚 Nội dung khóa học:\n${noi_dung}\n\n✨ ${after}\n${note}`
    }));
  }

  const GUITAR_ND = `1️⃣ Làm quen guitar và kỹ thuật cơ bản\n2️⃣ Học hợp âm, tiết tấu\n3️⃣ Học cách đệm các bài hát quen thuộc\n4️⃣ Thực hành đệm và biểu diễn các bài yêu thích`;
  const GUITAR_AF = 'Sau khóa học, học viên có thể tự đệm và trình diễn tự tin cùng nhạc cụ.';
  const LTG_ND = `1️⃣ Ôn luyện kỹ thuật guitar chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTG_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi guitar với kỹ thuật vững chắc.';

  const VIOLIN_ND = `1️⃣ Làm quen violin và tư thế cầm đàn đúng\n2️⃣ Học kỹ thuật kéo vĩ cung cơ bản\n3️⃣ Học đọc nhạc và luyện tập giai điệu\n4️⃣ Thực hành biểu diễn các bản nhạc đơn giản`;
  const VIOLIN_AF = 'Sau khóa học, học viên có thể chơi được các bản nhạc cơ bản và tự tin biểu diễn.';
  const LTV_ND = `1️⃣ Ôn luyện kỹ thuật violin chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTV_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi violin với kỹ thuật vững chắc.';

  const PIANO_ND = `1️⃣ Làm quen piano và hợp âm cơ bản\n2️⃣ Học đọc nhạc và luyện ngón tay\n3️⃣ Học đệm và chơi các bản nhạc đơn giản\n4️⃣ Thực hành chơi các bài nhạc yêu thích`;
  const PIANO_AF = 'Sau khóa học, học viên có thể tự chơi piano và đệm hát một số bài hát phổ biến.';
  const LTP_ND = `1️⃣ Ôn luyện kỹ thuật piano chuyên sâu\n2️⃣ Học và luyện các bài thi theo giáo trình chuẩn\n3️⃣ Rèn luyện tốc độ, độ chính xác và biểu cảm\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;
  const LTP_AF = 'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi piano với kỹ thuật vững chắc.';

  const PDH_ND = `1️⃣ Làm quen piano và hợp âm cơ bản\n2️⃣ Học cách đệm hát các bài hát quen thuộc\n3️⃣ Học pattern đệm piano đơn giản\n4️⃣ Thực hành đệm và hát các bài yêu thích`;
  const PDH_AF = 'Sau khóa học, học viên có thể tự đệm và hát một số bài hát phổ biến.';

  const UKU_ND = `1️⃣ Làm quen ukulele và tiết tấu cơ bản\n2️⃣ Học hợp âm và kỹ thuật gảy đàn\n3️⃣ Học đệm các bài hát vui và dễ chơi\n4️⃣ Thực hành đệm hát các bài yêu thích`;
  const UKU_AF = 'Sau khóa học, học viên có thể tự đệm hát được nhiều bài nhạc phổ biến một cách tự tin.';

  const TN_ND = `1️⃣ Luyện giọng và hơi thở cơ bản\n2️⃣ Học kỹ thuật hát rõ lời, lấy hơi đúng\n3️⃣ Học xử lý cảm xúc qua giọng hát\n4️⃣ Thực hành thể hiện các bài hát yêu thích`;
  const TN_AF = 'Sau khóa học, học viên có thể hát đúng kỹ thuật và tự tin biểu diễn trước đám đông.';

  const MN_ND = `1️⃣ Làm quen màu sắc và hình khối cơ bản\n2️⃣ Vẽ các hình đơn giản theo chủ đề\n3️⃣ Phát triển sự sáng tạo qua các bài tập\n4️⃣ Tạo ra các tác phẩm nghệ thuật đơn giản`;
  const CB_ND = `1️⃣ Kỹ thuật vẽ phác thảo và đường nét\n2️⃣ Học bố cục, ánh sáng và bóng đổ\n3️⃣ Vẽ tĩnh vật và phong cảnh cơ bản\n4️⃣ Thực hành hoàn thiện các bài vẽ hoàn chỉnh`;
  const KH_ND = `1️⃣ Làm quen chất liệu và dụng cụ vẽ chuyên biệt\n2️⃣ Học kỹ thuật xử lý màu đặc trưng theo từng chất liệu\n3️⃣ Thực hành vẽ các chủ đề đa dạng\n4️⃣ Hoàn thiện bài vẽ bằng chất liệu đã chọn`;
  const AC_ND = `1️⃣ Làm quen với canvas hoặc bảng vẽ kỹ thuật số\n2️⃣ Học kỹ thuật pha màu và xây dựng lớp màu\n3️⃣ Thực hành vẽ tác phẩm trên canvas hoặc phần mềm\n4️⃣ Hoàn thiện và trình bày tác phẩm cá nhân`;
  const LTV_ND2 = `1️⃣ Ôn luyện kỹ thuật vẽ chuyên sâu theo đề thi\n2️⃣ Học bố cục, tỉ lệ và biểu đạt cảm xúc trên tranh\n3️⃣ Luyện tập theo đúng thể thức và thời gian thi\n4️⃣ Thực hành thi thử và nhận xét chi tiết`;

  const B35_ND = `1️⃣ Làm quen với âm nhạc và chuyển động cơ bản\n2️⃣ Học tư thế đứng đúng và khả năng cân bằng\n3️⃣ Luyện tập các bước nhảy ballet đơn giản\n4️⃣ Biểu diễn các bài múa ngắn theo chủ đề`;
  const B69_ND = `1️⃣ Ôn luyện tư thế và kỹ thuật ballet cơ bản\n2️⃣ Học các bước nhảy và chuyển động trung cấp\n3️⃣ Luyện tập phối hợp nhịp điệu và âm nhạc\n4️⃣ Biểu diễn bài múa hoàn chỉnh cuối khóa`;
  const DA_ND = `1️⃣ Khởi động cơ thể và học nhịp điệu cơ bản\n2️⃣ Học các vũ đạo hiện đại phổ biến\n3️⃣ Luyện tập phối hợp nhóm và đồng điệu\n4️⃣ Biểu diễn bài múa nhóm cuối khóa`;
  const KV_ND = `1️⃣ Làm quen các điệu nhảy khiêu vũ cơ bản\n2️⃣ Học tư thế, bước đi và dẫn dắt\n3️⃣ Luyện tập phối hợp cặp đôi hoặc nhóm\n4️⃣ Thực hành nhảy trong các tình huống thực tế`;
  const MCT_ND = `1️⃣ Tìm hiểu về múa cổ trang và văn hóa dân tộc\n2️⃣ Học các động tác tay, chân đặc trưng\n3️⃣ Luyện tập biểu cảm và dáng điệu trên nhạc cụ thể\n4️⃣ Biểu diễn bài múa hoàn chỉnh theo chủ đề cổ trang`;
  const HT_ND = `1️⃣ Tìm hiểu môn học và không gian lớp học\n2️⃣ Trải nghiệm trực tiếp cùng giáo viên\n3️⃣ Nhận tư vấn lộ trình học phù hợp\n4️⃣ Giải đáp mọi thắc mắc trước khi đăng ký`;

  const allTemplates = [
    ...mk('Guitar','🎸', [
      ['🎸 GUITAR — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N],
      ['🎸 GUITAR — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',GUITAR_ND,GUITAR_AF,N5],
      ['🎸 GUITAR — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',GUITAR_ND,GUITAR_AF,N5],
    ]),
    ...mk('Luyện Thi Guitar','🏆', [
      ['🎸 LUYỆN THI GUITAR — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N],
      ['🎸 LUYỆN THI GUITAR — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTG_ND,LTG_AF,N5],
      ['🎸 LUYỆN THI GUITAR — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTG_ND,LTG_AF,N5],
    ]),
    ...mk('Violin','🎻', [
      ['🎻 VIOLIN — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N],
      ['🎻 VIOLIN — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',VIOLIN_ND,VIOLIN_AF,N5],
      ['🎻 VIOLIN — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',VIOLIN_ND,VIOLIN_AF,N5],
    ]),
    ...mk('Luyện Thi Violin','🏆', [
      ['🎻 LUYỆN THI VIOLIN — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N],
      ['🎻 LUYỆN THI VIOLIN — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTV_ND,LTV_AF,N5],
      ['🎻 LUYỆN THI VIOLIN — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND,LTV_AF,N5],
    ]),
    ...mk('Piano','🎹', [
      ['🎹 PIANO — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N],
      ['🎹 PIANO — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',PIANO_ND,PIANO_AF,N5],
      ['🎹 PIANO — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PIANO_ND,PIANO_AF,N5],
    ]),
    ...mk('Luyện Thi Piano','🏆', [
      ['🎹 LUYỆN THI PIANO — NHÓM 3 HỌC VIÊN (3 THÁNG)','6.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.000.000đ/lần',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — NHÓM 3 HỌC VIÊN (1 THÁNG)','2.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 2 HỌC VIÊN (3 THÁNG)','8.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','4.200.000đ/lần',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 2 HỌC VIÊN (1 THÁNG)','3.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N],
      ['🎹 LUYỆN THI PIANO — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',LTP_ND,LTP_AF,N5],
      ['🎹 LUYỆN THI PIANO — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTP_ND,LTP_AF,N5],
    ]),
    ...mk('Piano Đệm Hát','🎹🎤', [
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,N],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 1-1 CÁ NHÂN (3 THÁNG)','4.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.100.000đ/lần',PDH_ND,PDH_AF,'Anh/chị có thể tham gia buổi workshop cảm thụ âm nhạc trước khi đăng ký ạ.'],
      ['🎹🎤 PIANO ĐỆM HÁT — LỚP 1-1 CÁ NHÂN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',PDH_ND,PDH_AF,'Anh/chị có thể tham gia buổi workshop cảm thụ âm nhạc trước khi đăng ký ạ.'],
    ]),
    ...mk('Ukulele','🪕', [
      ['🪕 UKULELE — LỚP NHÓM 3 HỌC VIÊN (3 THÁNG)','5.400.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.700.000đ/lần',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP NHÓM 3 HỌC VIÊN (1 THÁNG)','2.000.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N],
      ['🪕 UKULELE — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',UKU_ND,UKU_AF,N5],
      ['🪕 UKULELE — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',UKU_ND,UKU_AF,N5],
    ]),
    ...mk('Thanh Nhạc','🎤', [
      ['🎤 THANH NHẠC — LỚP 2 HỌC VIÊN (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',TN_ND,TN_AF,N],
      ['🎤 THANH NHẠC — LỚP 2 HỌC VIÊN (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',TN_ND,TN_AF,N],
      ['🎤 THANH NHẠC — LỚP 1-1 CÁ NHÂN (3 THÁNG)','12.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','6.000.000đ/lần',TN_ND,TN_AF,N5],
      ['🎤 THANH NHẠC — LỚP 1-1 CÁ NHÂN (1 THÁNG)','4.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',TN_ND,TN_AF,N5],
    ]),
    ...mk('Vẽ – Mầm Non','🖍️', [
      ['🖍️ VẼ MẦM NON — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',MN_ND,'Sau khóa học, bé có nền tảng cảm nhận màu sắc, hình dạng và khả năng sáng tạo tự do.',N1],
      ['🖍️ VẼ MẦM NON — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',MN_ND,'Sau khóa học, bé có nền tảng cảm nhận màu sắc, hình dạng và khả năng sáng tạo tự do.',N1],
    ]),
    ...mk('Vẽ – Căn Bản','✏️', [
      ['✏️ VẼ CĂN BẢN — LỚP NHÓM (3 THÁNG)','3.300.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.650.000đ/lần',CB_ND,'Sau khóa học, học viên có nền tảng vẽ căn bản vững chắc để học các kỹ thuật nâng cao hơn.',N1],
      ['✏️ VẼ CĂN BẢN — LỚP NHÓM (1 THÁNG)','1.300.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',CB_ND,'Sau khóa học, học viên có nền tảng vẽ căn bản vững chắc để học các kỹ thuật nâng cao hơn.',N1],
    ]),
    ...mk('Vẽ – Ký Họa / Màu Nước / Marker','🖊️', [
      ['🖊️ KÝ HỌA / MÀU NƯỚC / MÀU MARKER — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',KH_ND,'Sau khóa học, học viên có thể sử dụng thành thạo chất liệu đã học và thể hiện phong cách riêng.',N1],
      ['🖊️ KÝ HỌA / MÀU NƯỚC / MÀU MARKER — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',KH_ND,'Sau khóa học, học viên có thể sử dụng thành thạo chất liệu đã học và thể hiện phong cách riêng.',N1],
    ]),
    ...mk('Vẽ – Acrylic / Digital Art','🖼️', [
      ['🖼️ MÀU ACRYLIC CANVAS / DIGITAL ART — LỚP NHÓM (3 THÁNG)','4.800.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','2.400.000đ/lần',AC_ND,'Sau khóa học, học viên có thể tạo ra các tác phẩm hội họa hoàn chỉnh trên canvas hoặc môi trường số.',N1],
      ['🖼️ MÀU ACRYLIC CANVAS / DIGITAL ART — LỚP NHÓM (1 THÁNG)','1.800.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',AC_ND,'Sau khóa học, học viên có thể tạo ra các tác phẩm hội họa hoàn chỉnh trên canvas hoặc môi trường số.',N1],
    ]),
    ...mk('Luyện Thi Vẽ','🎨', [
      ['🎨 LUYỆN THI VẼ — LỚP NHÓM (3 THÁNG)','7.200.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','3.600.000đ/lần',LTV_ND2,'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi mỹ thuật với kỹ năng và sự tự tin cao.',N1],
      ['🎨 LUYỆN THI VẼ — LỚP NHÓM (1 THÁNG)','2.600.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',LTV_ND2,'Sau khóa học, học viên sẵn sàng tham gia các kỳ thi mỹ thuật với kỹ năng và sự tự tin cao.',N1],
    ]),
    ...mk('Ballet 3–5 Tuổi','🩰', [
      ['🩰 BALLET 3–5 TUỔI — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',B35_ND,'Sau khóa học, bé phát triển sự dẻo dai, phối hợp cơ thể và tình yêu thích âm nhạc nghệ thuật.',N1],
      ['🩰 BALLET 3–5 TUỔI — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',B35_ND,'Sau khóa học, bé phát triển sự dẻo dai, phối hợp cơ thể và tình yêu thích âm nhạc nghệ thuật.',N1],
    ]),
    ...mk('Ballet 6–9 Tuổi','🩰', [
      ['🩰 BALLET 6–9 TUỔI — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',B69_ND,'Sau khóa học, học viên đạt được sự thành thục trong kỹ thuật ballet và tự tin trên sân khấu.',N1],
      ['🩰 BALLET 6–9 TUỔI — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',B69_ND,'Sau khóa học, học viên đạt được sự thành thục trong kỹ thuật ballet và tự tin trên sân khấu.',N1],
    ]),
    ...mk('Dance','💃', [
      ['💃 DANCE (NHẢY HIỆN ĐẠI) — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',DA_ND,'Sau khóa học, học viên có thể nhảy các phong cách hiện đại và tự tin biểu diễn trước mọi người.',N1],
      ['💃 DANCE (NHẢY HIỆN ĐẠI) — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',DA_ND,'Sau khóa học, học viên có thể nhảy các phong cách hiện đại và tự tin biểu diễn trước mọi người.',N1],
    ]),
    ...mk('Khiêu Vũ','🕺', [
      ['🕺 KHIÊU VŨ — LỚP NHÓM (3 THÁNG)','3.000.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.500.000đ/lần',KV_ND,'Sau khóa học, học viên có thể khiêu vũ tự tin trong các sự kiện, tiệc, giao lưu xã hội.',N1],
      ['🕺 KHIÊU VŨ — LỚP NHÓM (1 THÁNG)','1.200.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',KV_ND,'Sau khóa học, học viên có thể khiêu vũ tự tin trong các sự kiện, tiệc, giao lưu xã hội.',N1],
    ]),
    ...mk('Múa Cổ Trang','🏮', [
      ['🏮 MÚA CỔ TRANG — LỚP NHÓM (3 THÁNG)','3.600.000đ / khóa','3 tháng','24 buổi','2 buổi/tuần','1.800.000đ/lần',MCT_ND,'Sau khóa học, học viên có thể biểu diễn múa cổ trang đúng phong cách và tự tin trên sân khấu.',N1],
      ['🏮 MÚA CỔ TRANG — LỚP NHÓM (1 THÁNG)','1.400.000đ / tháng','1 tháng','8 buổi','2 buổi/tuần','',MCT_ND,'Sau khóa học, học viên có thể biểu diễn múa cổ trang đúng phong cách và tự tin trên sân khấu.',N1],
    ]),
    ...mk('Học Thử','⭐', [
      ['🔔 HỌC THỬ — LỚP NHÓM (10:1)','100.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
      ['🔔 HỌC THỬ — LỚP 2 HỌC VIÊN (2-1)','250.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
      ['🔔 HỌC THỬ — LỚP 1-1 CÁ NHÂN','500.000đ / buổi','1 buổi trải nghiệm','1 buổi','','',HT_ND,'Buổi học thử giúp anh/chị cảm nhận thực tế trước khi quyết định đăng ký khóa học chính thức.',''],
    ]),
  ];

  let baseId = Date.now();
  allTemplates.forEach((t, i) => { t.id = baseId + i; templates.push(t); });
  save();
}
// seedTemplatesIfEmpty se duoc goi trong initAppAfterLogin
// ── CHANGE PASSWORD MODAL ──
function showChangePasswordModal() {
  document.getElementById('cp-current').value = '';
  document.getElementById('cp-new').value = '';
  document.getElementById('cp-confirm').value = '';
  document.getElementById('cp-error').style.display = 'none';
  document.getElementById('cp-success').style.display = 'none';
  const modal = document.getElementById('change-pass-modal');
  modal.style.display = 'flex';
}


function openMyProfileModal() {
  document.getElementById('mp-display-name').value = window.VS_USER.displayName || window.VS_USER.username || '';
  document.getElementById('mp-phone').value = window.VS_USER.phone || '';
  document.getElementById('mp-email').value = window.VS_USER.email || '';
  document.getElementById('mp-bank-name').value = window.VS_USER.bankName || '';
  document.getElementById('mp-bank-account').value = window.VS_USER.bankAccount || '';
  
  document.getElementById('mp-current').value = '';
  document.getElementById('mp-new').value = '';
  document.getElementById('mp-confirm').value = '';
  
  const avatarUrl = window.VS_USER.avatar;
  if (avatarUrl) {
    document.getElementById('mp-avatar-preview').src = avatarUrl;
    document.getElementById('mp-avatar-preview').style.display = 'block';
    document.getElementById('mp-avatar-text').style.display = 'none';
  } else {
    document.getElementById('mp-avatar-preview').style.display = 'none';
    document.getElementById('mp-avatar-text').textContent = (window.VS_USER.displayName || 'U').substring(0,2).toUpperCase();
    document.getElementById('mp-avatar-text').style.display = 'flex';
  }
  
  document.getElementById('my-profile-modal').style.display = 'flex';
}

function previewMyAvatar(input) {
  if (input.files && input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      const img = document.getElementById('mp-avatar-preview');
      img.src = e.target.result;
      img.dataset.base64 = e.target.result;
      img.style.display = 'block';
      document.getElementById('mp-avatar-text').style.display = 'none';
    };
    r.readAsDataURL(input.files[0]);
  }
}

async function submitUpdateProfile() {
  const displayName = document.getElementById('mp-display-name').value.trim();
  const phone = document.getElementById('mp-phone').value.trim();
  const email = document.getElementById('mp-email').value.trim();
  const bankName = document.getElementById('mp-bank-name').value.trim();
  const bankAccount = document.getElementById('mp-bank-account').value.trim();
  const currentPass = document.getElementById('mp-current').value;
  const newPass = document.getElementById('mp-new').value;
  const confirmPass = document.getElementById('mp-confirm').value;
  const imgEl = document.getElementById('mp-avatar-preview');
  const avatarB64 = imgEl.dataset.base64 || '';

  if (!displayName) { showToast('Tên hiển thị không được để trống'); return; }
  if (newPass || confirmPass || currentPass) {
    if (!currentPass) { showToast('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (newPass.length < 8) { showToast('Mật khẩu mới ít nhất 8 ký tự'); return; }
    if (newPass !== confirmPass) { showToast('Xác nhận mật khẩu không khớp'); return; }
  }

  try {
    const payload = { displayName, phone, email, bankName, bankAccount };
    if (newPass) {
      payload.currentPassword = currentPass;
      payload.newPassword = newPass;
    }
    if (avatarB64) {
      payload.avatar = avatarB64;
    }

    const r = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vs_token') },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) { showToast(data.error || 'Lỗi cập nhật'); return; }
    
    showToast('Cập nhật hồ sơ thành công');
    
    window.VS_USER.displayName = data.displayName;
    window.VS_USER.phone = data.phone;
    window.VS_USER.email = data.email;
    window.VS_USER.bankName = data.bankName;
    window.VS_USER.bankAccount = data.bankAccount;
    if (data.avatar) window.VS_USER.avatar = data.avatar;
    
    window.VS_DISPLAY_NAME = data.displayName;
    if (data.avatar) window.VS_AVATAR = data.avatar;
    
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.textContent = data.displayName;
    
    if (window.VS_AVATAR) {
      const img = document.getElementById('nav-avatar-img');
      if (img) { img.src = window.VS_AVATAR; img.style.display = 'block'; }
      const txt = document.getElementById('nav-avatar-text');
      if (txt) txt.style.display = 'none';
    } else {
      const img = document.getElementById('nav-avatar-img');
      if (img) img.style.display = 'none';
      const txt = document.getElementById('nav-avatar-text');
      if (txt) { txt.textContent = data.displayName.substring(0,2).toUpperCase(); txt.style.display = 'flex'; }
    }

    document.getElementById('my-profile-modal').style.display = 'none';
    
    if (window.VS_ROLE === 'student' && typeof renderStudentOverview === 'function') renderStudentOverview();
    if (window.VS_ROLE === 'teacher' && typeof renderTeacherOverview === 'function') renderTeacherOverview();
  } catch(e) {
    showToast('Lỗi kết nối');
  }
}


window.initAppAfterLogin = async function() {
  try {
    const r    = await fetch('/api/load');
    if (!r.ok) throw new Error('Lỗi tải dữ liệu: ' + r.status);
    const data = await r.json();
    if (data.students)      students      = data.students;
    if (data.staff)         staff         = data.staff;
    if (data.leads)         leads         = data.leads;
    if (data.classes)       classes       = data.classes;
    if (data.attendance)    attendance    = data.attendance;
    if (data.makeups)       makeups       = data.makeups;
    if (data.templates)     templates     = data.templates;
    if (data.customCourses) customCourses = data.customCourses;
    if (data.customPrices)  customPrices  = data.customPrices;
    if (data.staffRoles) staffRoles = data.staffRoles;
    // Seed default teacher roles if none saved yet
    if (!staffRoles || staffRoles.length === 0) {
      staffRoles = [
        'Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele',
        'Giáo viên Trống','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance',
        'Giáo viên Khiêu Vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'
      ];
    }
    populateDynamicSelects();
    renderSettingsRoles();
    
    let staffUpdated = false;
    if (classes && staff) {
      classes.forEach(c => {
        if (c.teacher) {
          const existing = staff.find(s => (s.name || '').toLowerCase() === c.teacher.toLowerCase());
          if (!existing) {
            staffUpdated = true;
            const nextId = Date.now() + Math.floor(Math.random() * 1000) + staff.length;
            const newVsId = 'GV' + String(staff.length + 1).padStart(4, '0');
            const newStaff = { id: nextId, vsId: newVsId, name: c.teacher, dob: '', phone: '', role: 'Giáo Viên', status: 'Đang hoạt động', note: 'Tự động tạo từ TKB' };
            staff.push(newStaff);
            autoCreateStaffAccount(newStaff);
          }
        }
      });
      if (staffUpdated && typeof saveAsync === 'function') {
        saveAsync();
      }
    }
    renderDashboard();
    renderCoursesPage();
    seedTemplatesIfEmpty();

    // Hien menu Quan Tri Tai Khoan neu la admin
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role === 'admin') {
          const navSec = document.getElementById('nav-section-accounts');
          if (navSec) navSec.style.display = '';
        }
      }
    } catch(err) { console.error('Auth err', err); }
  } catch(e) {
    console.error('Lỗi load dữ liệu:', e);
    showToast('Lỗi load dữ liệu: ' + String(e.message || e), true);
  }
};

// ════════════════════════════════════════
//  QUẢN TRỊ TÀI KHOẢN
// ════════════════════════════════════════

function toggleLinkedFields() {
  const role = document.getElementById('acc-role')?.value;
  const sg = document.getElementById('linked-staff-group');
  const stg = document.getElementById('linked-student-group');
  if (sg)  sg.style.display  = role === 'teacher' ? '' : 'none';
  if (stg) stg.style.display = role === 'student'  ? '' : 'none';
}

async function renderAccountsPage() {
  // Fix: ensure page is full width inside .main
  const page = document.getElementById('page-accounts');
  if (page) { page.style.width='100%'; page.style.boxSizing='border-box'; page.style.overflowX='hidden'; }
  const wrap = document.getElementById('accounts-table-wrap');
  if (!wrap) return;
  wrap.style.width = '100%';
  wrap.style.overflowX = 'auto';
  wrap.style.boxSizing = 'border-box';
  wrap.innerHTML = '<div style="color:#aaa;font-size:13px;padding:10px;">Đang tải...</div>';
  try {
    const r = await fetch('/api/users');
    if (!r.ok) { wrap.innerHTML = '<div style="color:#D94F4F;font-size:13px;padding:10px;">Lỗi tải danh sách tài khoản</div>'; return; }
    const users = await r.json();
    const roleLabel = role => {
      const cfg = {
        admin:   {bg:'#FFF3CD',color:'#7a6000',border:'#FFE08A',text:'Quản Trị Viên'},
        staff:   {bg:'#E8F5E9',color:'#2E7D32',border:'#A5D6A7',text:'Nhân Viên'},
        teacher: {bg:'#EDE9FE',color:'#5b21b6',border:'#C4B5FD',text:'Giáo Viên'},
        student: {bg:'#DBEAFE',color:'#1e40af',border:'#93C5FD',text:'Học Viên'},
      }[role] || {bg:'#f3f4f6',color:'#374151',border:'#d1d5db',text:role};
      return `<span style="display:inline-block;background:${cfg.bg};color:${cfg.color};border:1.5px solid ${cfg.border};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;white-space:nowrap;">${cfg.text}</span>`;
    };
    window._cachedUsers = users;
    const rows=users.map((u,i)=> {
      const safeDisplay = (u.displayName||'').replace(/"/g,'&quot;');
      const linkedBadge = u.linkedStaffId
        ? `<span style="background:#dcfce7;color:#166534;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-left:4px;">${(staff||[]).find(s=>String(s.id)===String(u.linkedStaffId))?.vsId||'GV?'}</span>`
        : u.linkedStudentId
        ? `<span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-left:4px;">${(students||[]).find(s=>String(s.id)===String(u.linkedStudentId))?.vsId||'HV?'}</span>`
        : '';
      return `<tr>
        <td style="text-align:center;color:var(--muted);font-size:11px;">${i+1}</td>
        <td><div style="font-weight:700;color:var(--navy);font-size:13px;">${u.username}</div><div style="font-size:10px;color:var(--muted)">${u.id}</div></td>
        <td><div style="font-weight:600;font-size:13px;">${safeDisplay}</div>${linkedBadge}</td>
        <td>${roleLabel(u.role)}</td>
        <td style="text-align:center;">
          <div class="action-btns" style="justify-content:center;">
            <button class="btn-icon" onclick="openEditAccountModalById(${u.id})" title="Sửa">✎</button>
            <button class="btn-icon del" onclick="deleteAccount(${u.id},'${u.username}')" title="Xóa">✕</button>
          </div>
        </td>
      </tr>`;
    }).join('');
    wrap.innerHTML=`<div style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;"><table style="min-width:500px;width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="width:36px;text-align:center;">#</th>
        <th>Tên Đăng Nhập</th>
        <th>Họ Tên & Liên Kết</th>
        <th>Phân Quyền</th>
        <th style="width:90px;text-align:center;">Thao Tác</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  } catch {
    wrap.innerHTML = '<div style="color:#D94F4F;font-size:13px;padding:10px;">Lỗi kết nối server</div>';
  }
}

function openCreateAccountModal() {
  document.getElementById('account-modal-title').textContent = 'Cấp Tài Khoản Mới';
  document.getElementById('acc-edit-id').value = '';
  document.getElementById('acc-username').value = '';
  document.getElementById('acc-username').disabled = false;
  document.getElementById('acc-displayname').value = '';
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-password').placeholder = 'Ít nhất 8 ký tự';
  document.getElementById('acc-role').value = 'staff';
  if (document.getElementById('acc-linked-staff'))  document.getElementById('acc-linked-staff').value = '';
  if (document.getElementById('acc-linked-student')) document.getElementById('acc-linked-student').value = '';
  document.getElementById('acc-error').style.display = 'none';
  const ph = document.getElementById('acc-pass-hint');
  if (ph) ph.style.display = 'none';
  toggleLinkedFields();
  document.getElementById('account-modal').classList.add('open');
}

function openEditAccountModal(id, username, displayName, role, linkedStaffId, linkedStudentId) {
  document.getElementById('account-modal-title').textContent = 'Sửa Tài Khoản';
  document.getElementById('acc-edit-id').value = id;
  document.getElementById('acc-username').value = username;
  document.getElementById('acc-username').disabled = true;
  document.getElementById('acc-displayname').value = displayName;
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-password').placeholder = 'Để trống = giữ nguyên mật khẩu';
  document.getElementById('acc-role').value = role;
  if (document.getElementById('acc-linked-staff'))  document.getElementById('acc-linked-staff').value  = linkedStaffId||'';
  if (document.getElementById('acc-linked-student')) document.getElementById('acc-linked-student').value = linkedStudentId||'';
  document.getElementById('acc-error').style.display = 'none';
  const ph = document.getElementById('acc-pass-hint');
  if (ph) ph.style.display = '';
  toggleLinkedFields();
  document.getElementById('account-modal').classList.add('open');
}

function closeAccountModal() {
  document.getElementById('account-modal').classList.remove('open');
}

async function submitAccountForm() {
  const editId      = document.getElementById('acc-edit-id').value;
  const username    = document.getElementById('acc-username').value.trim();
  const displayName = document.getElementById('acc-displayname').value.trim();
  const password    = document.getElementById('acc-password').value;
  const role        = document.getElementById('acc-role').value;
  const errEl       = document.getElementById('acc-error');
  errEl.style.display = 'none';
  if (!displayName || !role) { errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; errEl.style.display = 'block'; return; }
  if (!editId && (!username || !password)) { errEl.textContent = 'Tên đăng nhập và mật khẩu là bắt buộc'; errEl.style.display = 'block'; return; }
  if (password && password.length < 8) { errEl.textContent = 'Mật khẩu ít nhất 8 ký tự'; errEl.style.display = 'block'; return; }
  const linkedStaffId   = document.getElementById('acc-linked-staff')?.value?.trim()||null;
  const linkedStudentId = document.getElementById('acc-linked-student')?.value?.trim()||null;
  try {
    let res;
    if (editId) {
      const body = { displayName, role };
      if (password) body.password = password;
      res = await fetch('/api/users/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, displayName, password, role }) });
    }
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Lỗi server'; errEl.style.display = 'block'; return; }
    closeAccountModal();
    showToast(editId ? 'Đã cập nhật tài khoản!' : 'Đã cấp tài khoản mới!');
    renderAccountsPage();
  } catch { errEl.textContent = 'Lỗi kết nối server'; errEl.style.display = 'block'; }
}

async function deleteAccount(id, username) {
  confirmDelete('tài khoản "' + username + '"', async () => {
    try {
      const res = await fetch('/api/users/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Lỗi xóa tài khoản', true); return; }
      showToast('Đã xóa tài khoản!');
      renderAccountsPage();
    } catch { showToast('Lỗi kết nối server', true); }
  });
}
function viewClassDetail(classId){
  const c=classes.find(x=>Number(x.id)===Number(classId));
  if(!c){showPage('classes');return;}
  const page=document.getElementById('page-class-detail');
  if(!page)return;
  const sched=(c.schedule||[]).map(s=>`<span class="pos-badge" style="font-size:11px;margin-right:4px;">${s.day} ${s.start}–${s.end}</span>`).join('')||'<span style="color:var(--muted)">Chưa có lịch</span>';
  const cs=students.filter(s=>Number(s.classid)===Number(classId));
  const pb=p=>p==='Đã Chuyển Khoản'?`<span class="badge badge-paid">CK</span>`:p==='Tiền Mặt'?`<span class="badge badge-cash">TM</span>`:`<span class="badge badge-unpaid">Chưa TT</span>`;
  const rows=cs.length===0
    ?`<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">Chưa có học viên nào trong lớp</div></div></td></tr>`
    :cs.map((s,i)=>`<tr>
      <td>${i+1}</td><td class="td-name">${s.name}</td>
      <td>${s.parent||'–'}</td><td>${s.phone||'–'}</td>
      <td style="font-weight:600;color:var(--navy)">${s.subject}${s.pkg?`<br><span style="font-size:10px;color:var(--muted)">${s.pkg}</span>`:''}</td>
      <td>${pb(s.payment)}</td>
      <td><div class="action-btns">
        <button class="btn-icon" onclick="editStudent(${s.id})" title="Sửa">✎</button>
        <button class="btn-icon del" onclick="removeStudentFromClass(${s.id},${classId})" title="Gỡ">✕</button>
      </div></td></tr>`).join('');
  page.innerHTML=`
    <div class="page-header">
      <div class="page-title">Chi Tiết <span>Lớp Học</span></div>
      <div class="page-sub">[${c.code}] ${c.name} – ${c.subject}</div>
    </div>
    <div class="card" style="margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:16px;">
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Mã Lớp</div><div style="font-weight:800;color:var(--navy);font-size:16px;">${c.code}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Khóa Học</div><div style="font-weight:700;color:var(--navy)">${c.subject}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Giáo Viên</div><div style="font-weight:600;">${c.teacher||'–'}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Phòng</div><div style="font-weight:600;">${c.room||'–'}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:3px;">Số Học Viên</div><div style="font-weight:800;color:var(--gold);font-size:22px;">${cs.length}</div></div>
      </div>
      <div><div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Lịch Học</div><div>${sched}</div></div>
      ${c.note?`<div style="margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--cream2);padding-top:10px;">Ghi chú: ${c.note}</div>`:''}
    </div>
    <div class="card">
      <div class="toolbar" style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:15px;color:var(--navy)">Danh Sách Học Viên <span style="color:var(--gold)">(${cs.length})</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="addStudentToClass(${classId})">+ Thêm Học Viên</button>
          <button class="btn btn-outline" onclick="editClass(${classId})">✎ Sửa Lớp</button>
          <button class="btn btn-outline" onclick="showPage('classes')">← Danh Sách Lớp</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Họ Tên</th><th>Phụ Huynh</th><th>SĐT</th><th>Khóa Học</th><th>Học Phí</th><th>Thao Tác</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  showPage('class-detail');
}
function addStudentToClass(classId){
  editStudentId=null; clearStudentForm();
  const cls=classes.find(c=>Number(c.id)===Number(classId));
  showPage('add-student');
  setTimeout(()=>{
    if(cls){
      const se=document.getElementById('f-subject');
      if(se){se.value=cls.subject;populatePackages('');}
      setTimeout(()=>{
        const ce=document.getElementById('f-classid'); if(ce) ce.value=classId;
        const te=document.getElementById('form-title');
        if(te) te.innerHTML=`Thêm Học Viên vào <span>[${cls.code}] ${cls.name}</span>`;
        window._addStudentForClassId=classId;
      },60);
    }
  },60);
}
function removeStudentFromClass(studentId,classId){
  const s=students.find(x=>x.id===studentId); if(!s)return;
  confirmDelete('gỡ học viên '+s.name+' khỏi lớp',()=>{
    const i=students.findIndex(x=>x.id===studentId);
    if(i!==-1) students[i]={...students[i],classid:0};
    saveAsync().then(ok=>{if(ok){showToast('Đã gỡ '+s.name+' khỏi lớp.');viewClassDetail(classId);}});
  });
}

function populateDynamicSelects() {
  // Populate f-subject
  const fSubj = document.getElementById('f-subject-custom');
  if (fSubj) {
    let html = '';
    customCourses.forEach(c => {
      html += `<option value="${c.name}">${c.name}</option>`;
    });
    fSubj.innerHTML = html;
  }
  
  // Populate st-role
  const stRoleOpt = document.getElementById('st-role-teachers');
  if (stRoleOpt) {
    const roles = staffRoles.length ? staffRoles : ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
    let html = '';
    roles.forEach(r => html += `<option>${r}</option>`);
    stRoleOpt.innerHTML = html;
  }
}

function renderSettingsRoles() {
  const list = document.getElementById('settings-roles-list');
  if (!list) return;
  const roles = staffRoles.length ? staffRoles : ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
  list.innerHTML = roles.map((r,i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #eee;">
      <span style="font-weight:600;font-size:13px;color:var(--navy);">${r}</span>
      <button class="btn btn-outline" style="color:#dc2626;border-color:#fca5a5;padding:4px 8px;" onclick="deleteCustomRole(${i})">Xóa</button>
    </div>
  `).join('');
}

function addCustomRole() {
  const input = document.getElementById('set-role-name');
  const val = input.value.trim();
  if (!val) return;
  if (!staffRoles.length) {
    staffRoles = ['Giáo viên Piano','Giáo viên Guitar','Giáo viên Violin','Giáo viên Ukulele','Giáo viên Vẽ','Giáo viên Ballet','Giáo viên Dance','Giáo viên Khiêu vũ','Giáo viên Múa Cổ Trang','Giáo viên Thanh Nhạc'];
  }
  if (!staffRoles.includes(val)) {
    staffRoles.push(val);
    save();
    input.value = '';
    renderSettingsRoles();
    populateDynamicSelects();
    showToast('Đã thêm chức vụ!');
  }
}

function deleteCustomRole(index) {
  confirmDelete('chức vụ', () => {
    staffRoles.splice(index, 1);
    save();
    renderSettingsRoles();
    populateDynamicSelects();
  });
}

function renderSettingsCourses() {
  const list = document.getElementById('settings-courses-list');
  if (!list) return;
  if (!customCourses.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:10px;">Chưa có môn học tùy chỉnh nào.</div>';
    return;
  }
  list.innerHTML = customCourses.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #eee;">
      <div>
        <span style="font-weight:600;font-size:13px;color:var(--navy);">${c.emoji} ${c.name}</span>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">Ký hiệu: ${c.key}</div>
      </div>
      <div>
        <button class="btn btn-outline" style="padding:4px 8px;margin-right:4px;" onclick="editCustomCourse('${c.key}');showPage('courses');">Sửa gói</button>
        <button class="btn btn-outline" style="color:#dc2626;border-color:#fca5a5;padding:4px 8px;" onclick="deleteCustomCourse('${c.key}');setTimeout(renderSettingsCourses,500);">Xóa</button>
      </div>
    </div>
  `).join('');
}

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

  try {
    // Optionally fetch if needed, but we rely on local staff array for now.
    await fetch(`/api/staff-attendance?month=${monthStr}`).catch(()=>null);
  } catch(e) {
    console.warn('[PAYROLL API] Failed to fetch attendance', e);
  }

  // Use a slight timeout to allow UI to render the loading state first
  setTimeout(() => {
    recalcPayroll();
  }, 50);
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


// ═══════════════════════════════════════════════════
// NEW PAYROLL MODULE V3 (Tháng 08 Vinsoul Format)
// ═══════════════════════════════════════════════════

window.recalcPayroll = function() {
  const content = document.getElementById('payroll-content');
  if (!content) return;

  try {
    const monthInput = document.getElementById('pr-month');
    const month = (monthInput && monthInput.value) ? monthInput.value : new Date().toISOString().slice(0,7);
    window._payrollMonth = month;
    
    if (!staff || !Array.isArray(staff)) {
        throw new Error("Dữ liệu nhân sự (staff) không hợp lệ hoặc chưa được tải.");
    }

    if (staff.length === 0) {
      content.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">
        Chưa có nhân sự. <a onclick="showPage('staff')" style="color:var(--gold);cursor:pointer;font-weight:700;">Vào GV & Nhân Viên để thêm →</a>
      </div></div>`;
      return;
    }

    let totalPayroll = 0;
    const validRows = [];
    
    // Build rows carefully with individual try/catch
    staff.forEach((s, i) => {
      try {
        if (!s) return; // skip null staff
        
        // defaults config
        const type = s.salary_type || 'monthly';
        const base = Number(s.base_salary) || 0;
        const std = Number(s.standard_days) || 0;
        const hrRate = Number(s.hourly_rate) || 0;
        const extRate = Number(s.external_hourly_rate) || 0;
        const subRate = Number(s.substitute_hourly_rate) || 0;
        
        // monthly variables
        const mData = s['pr_' + month] || {};
        const status = mData.status || 'Chưa xác nhận';
        const wDays = Number(mData.worked_days) || 0;
        const wHours = Number(mData.worked_hours) || 0;
        const extHours = Number(mData.external_hours) || 0;
        const subHours = Number(mData.substitute_hours) || 0;
        const lateCount = Number(mData.late_penalties_count) || 0;
        const lateAmt = Number(mData.late_penalty_amount) || 0;
        const lateNote = mData.late_note || '';

        let total = 0;
        if (type === 'monthly') {
          const daily = std > 0 ? (base / std) : 0;
          total = (daily * wDays) - lateAmt;
        } else {
          total = (wHours * hrRate) + (extHours * extRate) + (subHours * subRate) - lateAmt;
        }
        
        // Prevent negative or invalid salary
        total = Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0;
        
        totalPayroll += total;

        validRows.push({
          s, type, base, std, hrRate, extRate, subRate,
          status, wDays, wHours, extHours, subHours, lateCount, lateAmt, lateNote, total, i
        });
      } catch (rowErr) {
        console.error('[PAYROLL RENDER] Lỗi khi xử lý nhân sự:', s, rowErr);
      }
    });

    const statsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalPayroll)}</div><div class="stat-label">Tổng Chi Lương</div></div>
      <div class="stat-card"><div class="stat-value">${validRows.length}</div><div class="stat-label">Nhân Viên</div></div>
    </div>`;

    let tableHtml = `<div class="table-wrap"><table class="table" style="font-size:13px; text-align:center; vertical-align:middle;">
      <thead>
        <tr>
          <th style="width:50px;">STT</th>
          <th style="text-align:left;min-width:140px;">Họ và tên</th>
          <th>Chức vụ</th>
          <th>XÁC NHẬN</th>
          <th>Rate lương/1h</th>
          <th>Số giờ làm</th>
          <th>Chuyên cần</th>
          <th>Vi phạm Lỗi</th>
          <th style="text-align:right;">Tổng lương (VNĐ)</th>
          <th>STK Ngân Hàng</th>
        </tr>
      </thead>
      <tbody>`;

    validRows.forEach((r) => {
      try {
        const s = r.s;
        const isLocked = r.status === 'ĐÃ XÁC NHẬN';
        
        // 1. Name & Type Badge
        const nameHtml = `
          <div style="font-weight:600;color:var(--navy);font-size:14px;margin-bottom:4px;">${s.name || 'Chưa cập nhật'}</div>
          ${r.type === 'monthly' ? '<div style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;">LƯƠNG CỨNG</div>' : ''}
        `;

        // 2. Status Dropdown
        const statusColor = isLocked ? '#bbf7d0' : '#fef08a';
        const statusText = isLocked ? '#166534' : '#854d0e';
        const statusDropdown = `
          <select onchange="togglePayrollStatus(${s.id}, this)" style="background:${statusColor};color:${statusText};border:1px solid ${statusText};border-radius:4px;padding:4px;font-size:11px;font-weight:700;">
            <option value="Chưa xác nhận" ${!isLocked?'selected':''}>Chưa xác nhận</option>
            <option value="ĐÃ XÁC NHẬN" ${isLocked?'selected':''}>ĐÃ XÁC NHẬN</option>
          </select>
        `;

        // 3. Rate Display
        let rateHtml = '';
        if (r.type === 'monthly') {
          rateHtml += `<div style="font-weight:600;">${fmt(r.base)}</div>`;
          if (r.extRate > 0) rateHtml += `<div style="font-size:11px;color:var(--muted);">${fmt(r.extRate)} / 1 tiết dạy ngoài</div>`;
          if (r.subRate > 0) rateHtml += `<div style="font-size:11px;color:var(--muted);">Dạy thay ${fmt(r.subRate)}/h</div>`;
        } else {
          rateHtml += `<div style="font-weight:600;">${fmt(r.hrRate)}</div>`;
          if (r.extRate > 0) rateHtml += `<div style="font-size:11px;color:var(--muted);">Ngoài: ${fmt(r.extRate)}</div>`;
          if (r.subRate > 0) rateHtml += `<div style="font-size:11px;color:var(--muted);">Thay: ${fmt(r.subRate)}</div>`;
        }
        const rateCell = isLocked ? rateHtml : `<div style="cursor:pointer;padding:8px;border:1px dashed transparent;border-radius:6px;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='transparent'" onclick="openPrConfigModal(${s.id})">${rateHtml || '<span style="color:#aaa">Chưa cấu hình</span>'}</div>`;

        // 4. Hours Display
        let hoursHtml = '';
        if (r.type === 'monthly') {
          hoursHtml += `<div style="font-weight:600;">${r.wDays}/${r.std} NGÀY</div>`;
          const curDaily = r.std > 0 ? (r.base / r.std) : 0;
          hoursHtml += `<div style="font-size:11px;font-weight:700;color:var(--navy);">${fmt(curDaily * r.wDays)}</div>`;
        } else {
          hoursHtml += `<div style="font-weight:600;">${r.wHours} TIẾT</div>`;
          if (r.extHours > 0) hoursHtml += `<div style="font-size:11px;color:var(--muted);">${r.extHours} TIẾT DẠY NGOÀI</div>`;
          if (r.subHours > 0) hoursHtml += `<div style="font-size:11px;color:var(--muted);">${r.subHours} TIẾT DẠY THAY</div>`;
        }
        const hoursCell = isLocked ? hoursHtml : `<div style="cursor:pointer;padding:8px;border:1px dashed transparent;border-radius:6px;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='transparent'" onclick="openPrMonthModal(${s.id})">${hoursHtml || '<span style="color:#aaa">Chưa nhập</span>'}</div>`;

        // 5. Late Display
        let lateHtml = '';
        if (r.lateCount > 0 || r.lateAmt > 0) {
          lateHtml += `<div>${r.lateCount} LỖI TRỄ</div>`;
          if (r.lateAmt > 0) lateHtml += `<div style="color:#dc2626;">-${fmt(r.lateAmt)}</div>`;
          if (r.lateNote) lateHtml += `<div style="font-size:10px;color:var(--muted);">${r.lateNote}</div>`;
        }
        const lateCell = isLocked ? lateHtml : `<div style="cursor:pointer;padding:8px;border:1px dashed transparent;border-radius:6px;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='transparent'" onclick="openPrMonthModal(${s.id})">${lateHtml || '<span style="color:#aaa">Không</span>'}</div>`;

        // 6. Bank Display
        let bankHtml = '';
        if (s.bankInfo || s.bankName) {
          if (s.bankInfo) bankHtml += `<div>STK: ${s.bankInfo}</div>`;
          if (s.bankName) bankHtml += `<div>${s.bankName}</div>`;
          if (s.bankAccountName) bankHtml += `<div style="font-size:11px;text-transform:uppercase;">${s.bankAccountName}</div>`;
        }
        const bankCell = `<div style="font-size:11px;color:var(--muted);text-align:center;">${bankHtml || '<span style="color:#aaa">Chưa có STK</span>'}</div>`;

        tableHtml += `
          <tr style="background:${r.i%2===0?'#fff':'#f8fafc'}">
            <td>${r.i+1}</td>
            <td style="text-align:left;">${nameHtml}</td>
            <td style="font-weight:600;font-size:12px;">${s.role || 'Nhân sự'}</td>
            <td>${statusDropdown}</td>
            <td>${rateCell}</td>
            <td>${hoursCell}</td>
            <td></td>
            <td>${lateCell}</td>
            <td style="text-align:right;font-weight:800;color:var(--gold);font-size:15px;">${fmt(r.total)}</td>
            <td>${bankCell}</td>
          </tr>
        `;
      } catch (renderErr) {
        console.error('[PAYROLL HTML] Lỗi khi tạo HTML cho nhân viên:', r.s, renderErr);
      }
    });

    tableHtml += `</tbody></table></div>`;
    content.innerHTML = statsHtml + tableHtml;
  } catch (globalErr) {
    console.error('[PAYROLL CALC] Lỗi nghiêm trọng:', globalErr);
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon" style="color:red">⚠️</div>
      <div class="empty-text">Có lỗi xảy ra khi tính bảng lương.</div>
      <div style="font-size:12px;color:var(--muted);margin-top:10px;">Vui lòng kiểm tra console log hoặc thử lại.</div>
      <button onclick="recalcPayroll()" class="btn btn-gold" style="margin-top:15px">Thử Lại</button>
    </div>`;
  }
};

window.openPrConfigModal = function(staffId) {
  const s = staff.find(x => x.id === staffId);
  if (!s) return;
  document.getElementById('pr-cfg-staffid').value = staffId;
  document.getElementById('pr-config-name').textContent = s.name + ' - ' + (s.role || 'Nhân sự');
  
  document.getElementById('pr-cfg-type').value = s.salary_type || 'monthly';
  document.getElementById('pr-cfg-base').value = s.base_salary || '';
  document.getElementById('pr-cfg-std').value = s.standard_days || '';
  document.getElementById('pr-cfg-hourly').value = s.hourly_rate || '';
  document.getElementById('pr-cfg-ext').value = s.external_hourly_rate || '';
  document.getElementById('pr-cfg-sub').value = s.substitute_hourly_rate || '';
  
  window.togglePrCfgFields();
  document.getElementById('pr-config-modal').classList.add('open');
};

window.closePrConfigModal = function() {
  document.getElementById('pr-config-modal').classList.remove('open');
};

window.togglePrCfgFields = function() {
  const type = document.getElementById('pr-cfg-type').value;
  document.querySelectorAll('.monthly-cfg').forEach(el => el.style.display = type === 'monthly' ? 'block' : 'none');
  document.querySelectorAll('.hourly-cfg').forEach(el => el.style.display = type === 'hourly' ? 'block' : 'none');
};

window.savePrConfig = function() {
  const id = Number(document.getElementById('pr-cfg-staffid').value);
  const s = staff.find(x => x.id === id);
  if (!s) return;
  
  s.salary_type = document.getElementById('pr-cfg-type').value;
  s.base_salary = Number(document.getElementById('pr-cfg-base').value) || 0;
  s.standard_days = Number(document.getElementById('pr-cfg-std').value) || 0;
  s.hourly_rate = Number(document.getElementById('pr-cfg-hourly').value) || 0;
  s.external_hourly_rate = Number(document.getElementById('pr-cfg-ext').value) || 0;
  s.substitute_hourly_rate = Number(document.getElementById('pr-cfg-sub').value) || 0;
  
  saveAsync().then((ok) => {
    if(!ok) return;
    closePrConfigModal();
    showToast('Đã lưu cấu hình lương!');
    recalcPayroll();
  });
};

window.openPrMonthModal = function(staffId) {
  const s = staff.find(x => x.id === staffId);
  if (!s) return;
  document.getElementById('pr-month-staffid').value = staffId;
  document.getElementById('pr-month-name').textContent = s.name + ' - ' + (s.role || 'Nhân sự');
  
  const month = window._payrollMonth;
  const mData = s['pr_' + month] || {};
  
  document.getElementById('pr-var-wdays').value = mData.worked_days || '';
  document.getElementById('pr-var-whours').value = mData.worked_hours || '';
  document.getElementById('pr-var-ext').value = mData.external_hours || '';
  document.getElementById('pr-var-sub').value = mData.substitute_hours || '';
  document.getElementById('pr-var-latecount').value = mData.late_penalties_count || '';
  document.getElementById('pr-var-lateamt').value = mData.late_penalty_amount || '';
  document.getElementById('pr-var-latenote').value = mData.late_note || '';
  
  // Show/hide fields based on type
  const type = s.salary_type || 'monthly';
  document.querySelectorAll('.monthly-var').forEach(el => el.style.display = type === 'monthly' ? 'block' : 'none');
  document.querySelectorAll('.hourly-var').forEach(el => el.style.display = type === 'hourly' ? 'block' : 'none');
  
  document.getElementById('pr-month-modal').classList.add('open');
};

window.closePrMonthModal = function() {
  document.getElementById('pr-month-modal').classList.remove('open');
};

window.savePrMonth = function() {
  const id = Number(document.getElementById('pr-month-staffid').value);
  const s = staff.find(x => x.id === id);
  if (!s) return;
  
  const month = window._payrollMonth;
  if (!s['pr_' + month]) s['pr_' + month] = {};
  const mData = s['pr_' + month];
  
  mData.worked_days = Number(document.getElementById('pr-var-wdays').value) || 0;
  mData.worked_hours = Number(document.getElementById('pr-var-whours').value) || 0;
  mData.external_hours = Number(document.getElementById('pr-var-ext').value) || 0;
  mData.substitute_hours = Number(document.getElementById('pr-var-sub').value) || 0;
  mData.late_penalties_count = Number(document.getElementById('pr-var-latecount').value) || 0;
  mData.late_penalty_amount = Number(document.getElementById('pr-var-lateamt').value) || 0;
  mData.late_note = document.getElementById('pr-var-latenote').value.trim();
  
  saveAsync().then(ok => { if(!ok) return;
    closePrMonthModal();
    showToast('Đã lưu số liệu tháng!');
    recalcPayroll();
  });
};

window.togglePayrollStatus = function(staffId, selectElem) {
  const s = staff.find(x => x.id === staffId);
  if (!s) return;
  const month = window._payrollMonth;
  if (!s['pr_' + month]) s['pr_' + month] = {};
  
  const newStatus = selectElem.value;
  s['pr_' + month].status = newStatus;
  
  saveAsync().then(ok => { if(!ok) return;
    showToast(newStatus === 'ĐÃ XÁC NHẬN' ? 'Đã chốt bảng lương!' : 'Đã mở khóa bảng lương!');
    recalcPayroll();
  });
};

// Replace export function for new columns
window.exportPayrollCSV = function() {
  const month = window._payrollMonth;
  if (!staff || !staff.length) return showToast('Không có dữ liệu', true);
  
  let csv = 'STT,Ho Ten,Chuc Vu,Trang Thai,Loai Luong,Rate Co Ban/Thang,Ngay Chuan,Rate Day Ngoai,Rate Day Thay,Ngay Lam,Gio/Tiet Lam,Tiet Day Ngoai,Tiet Day Thay,Vi Pham,Tru Tien,Tong Luong\n';
  
  staff.forEach((s, i) => {
    const type = s.salary_type || 'monthly';
    const base = Number(s.base_salary) || 0;
    const std = Number(s.standard_days) || 0;
    const hrRate = Number(s.hourly_rate) || 0;
    const extRate = Number(s.external_hourly_rate) || 0;
    const subRate = Number(s.substitute_hourly_rate) || 0;
    
    const mData = s['pr_' + month] || {};
    const status = mData.status || 'Chua xac nhan';
    const wDays = Number(mData.worked_days) || 0;
    const wHours = Number(mData.worked_hours) || 0;
    const extHours = Number(mData.external_hours) || 0;
    const subHours = Number(mData.substitute_hours) || 0;
    const lateCount = Number(mData.late_penalties_count) || 0;
    const lateAmt = Number(mData.late_penalty_amount) || 0;

    let total = 0;
    if (type === 'monthly') {
      const daily = std > 0 ? (base / std) : 0;
      total = (daily * wDays) - lateAmt;
    } else {
      total = (wHours * hrRate) + (extHours * extRate) + (subHours * subRate) - lateAmt;
    }
    total = Math.max(0, Math.round(total));
    
    const rateText = type === 'monthly' ? base : hrRate;
    csv += `${i+1},"${s.name}","${s.role||''}","${status}","${type}","${rateText}","${std}","${extRate}","${subRate}","${wDays}","${wHours}","${extHours}","${subHours}","${lateCount}","${lateAmt}","${total}"\n`;
  });
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Luong_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất báo cáo CSV!');
};


// ==========================================
// ACCOUNTS MANAGEMENT UI REWRITE (v3.0)
// ==========================================

let _currentAccountsFilter = 'ALL';
let _allUsersCache = [];

window.renderAccountsPage = async function() {
  const wrap = document.getElementById('accounts-table-wrap');
  if (!wrap) return;
  
  // Inject tabs if missing
  const page = document.getElementById('page-accounts');
  let tabsWrap = document.getElementById('acc-tabs-wrap');
  if (!tabsWrap && page) {
     tabsWrap = document.createElement('div');
     tabsWrap.id = 'acc-tabs-wrap';
     tabsWrap.className = 'filter-tabs';
     tabsWrap.innerHTML = `
        <button class="filter-tab active" onclick="setAccFilter('ALL', this)">Tất Cả</button>
        <button class="filter-tab" onclick="setAccFilter('PENDING', this)" style="background:#fff7ed;color:#92400e;border-color:#f59e0b;">⏳ Đang Chờ Duyệt</button>
        <button class="filter-tab" onclick="setAccFilter('APPROVED', this)" style="background:#dcfce7;color:#14532d;border-color:#4ade80;">✅ Đã Duyệt</button>
        <button class="filter-tab" onclick="setAccFilter('LOCKED', this)" style="background:#fef2f2;color:#991b1b;border-color:#f87171;">🔒 Đã Khóa</button>
     `;
     const card = document.querySelector('#page-accounts .card');
     if (card) {
        card.parentNode.insertBefore(tabsWrap, card);
     }
  }

  wrap.innerHTML = '<div style="padding:20px;text-align:center;">Đang tải dữ liệu tài khoản...</div>';
  
  try {
    const r = await fetch('/api/users');
    if (!r.ok) { wrap.innerHTML = '<div style="color:red;">Lỗi tải danh sách tài khoản</div>'; return; }
    
    _allUsersCache = await r.json();
    renderFilteredAccounts();
  } catch (e) {
    wrap.innerHTML = '<div style="color:red;">Lỗi kết nối server</div>';
  }
};

window.setAccFilter = function(status, btn) {
    _currentAccountsFilter = status;
    const btns = document.querySelectorAll('#acc-tabs-wrap .filter-tab');
    btns.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFilteredAccounts();
};

window.renderFilteredAccounts = function() {
    const wrap = document.getElementById('accounts-table-wrap');
    if (!wrap) return;

    let filtered = _allUsersCache;
    if (_currentAccountsFilter === 'PENDING') filtered = filtered.filter(u => u.status === 'PENDING');
    else if (_currentAccountsFilter === 'APPROVED') filtered = filtered.filter(u => u.status === 'APPROVED');
    else if (_currentAccountsFilter === 'LOCKED') filtered = filtered.filter(u => u.status === 'REJECTED' || u.status === 'SUSPENDED');

    const roleBadge = (roleId) => {
        const map = {
            'ADMIN': '<span class="badge badge-paid">Quản Trị Viên</span>',
            'MARKETING': '<span class="badge" style="background:#fff7ed;color:#c2410c">Marketing</span>',
            'GIAO_VU': '<span class="badge" style="background:#eff6ff;color:#1d4ed8">Giáo Vụ</span>',
            'GIAO_VIEN': '<span class="badge" style="background:#faf5ff;color:#7e22ce">Giáo Viên</span>',
            'HOC_VIEN': '<span class="badge badge-unpaid" style="background:#f3f4f6;color:#374151">Học Viên</span>'
        };
        return map[roleId] || '<span class="badge" style="background:#f3f4f6;color:#374151">Chưa cấp quyền</span>';
    };

    const statusBadge = (s) => {
        if (s === 'PENDING') return '<span class="badge badge-cash">Chờ Duyệt</span>';
        if (s === 'APPROVED') return '<span class="badge badge-paid">Đang Hoạt Động</span>';
        if (s === 'REJECTED' || s === 'SUSPENDED') return '<span class="badge badge-unpaid">Đã Khóa</span>';
        return s;
    };

    const rows = filtered.map((u, i) => {
        let actions = '';
        if (u.loginType === 'GOOGLE') {
            if (u.status === 'PENDING') {
                actions = `
                    <button class="btn btn-outline" style="color:green;border-color:green;" onclick="approveAccount(${u.id})">✅ Duyệt</button>
                    <button class="btn btn-outline" style="color:red;border-color:red;" onclick="updateAccountStatus(${u.id}, 'REJECTED')">❌ Từ Chối</button>
                `;
            } else if (u.status === 'APPROVED') {
                actions = `
                    <button class="btn btn-outline" onclick="changeAccountRole(${u.id}, '${u.roleId}')">🔄 Đổi Quyền</button>
                    <button class="btn btn-outline" style="color:orange;border-color:orange;" onclick="updateAccountStatus(${u.id}, 'SUSPENDED')">🔒 Khóa</button>
                `;
            } else {
                actions = `
                    <button class="btn btn-outline" style="color:green;border-color:green;" onclick="updateAccountStatus(${u.id}, 'APPROVED')">🔓 Mở Khóa</button>
                `;
            }
            actions += ` <button class="btn btn-icon" onclick="deleteAccount(${u.id}, '${u.username || u.email}')">🗑️</button>`;
        } else {
            // Student accounts
            actions = `<span style="font-size:11px;color:#aaa;">Quản lý từ tab Học Viên</span>`;
        }

        return `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div style="font-weight:700;color:var(--navy);">${u.displayName || u.username}</div>
                <div style="font-size:11px;color:#777;">${u.email || u.username}</div>
            </td>
            <td><div style="font-size:11px;font-weight:700;color:#666;">${u.loginType || 'STUDENT'}</div></td>
            <td>${roleBadge(u.roleId)}</td>
            <td>${statusBadge(u.status)}</td>
            <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
            <td><div class="action-btns" style="gap:6px;">${actions}</div></td>
        </tr>
        `;
    }).join('');

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th>Tên / Email</th>
                    <th>Loại Login</th>
                    <th>Phân Quyền (Role)</th>
                    <th>Trạng Thái</th>
                    <th>Ngày Tạo</th>
                    <th>Thao Tác</th>
                </tr>
            </thead>
            <tbody>${rows.length ? rows : '<tr><td colspan="7"><div class="empty-state"><div class="empty-text">Không có tài khoản nào</div></div></td></tr>'}</tbody>
        </table>
    `;
};

window.approveAccount = function(userId) {
    const roleId = prompt('Nhập chức vụ cấp cho tài khoản này (ADMIN, MARKETING, GIAO_VU, GIAO_VIEN):\n(Mặc định: GIAO_VIEN)', 'GIAO_VIEN');
    if (!roleId) return;
    
    fetch('/api/users/' + userId + '/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: roleId.toUpperCase() })
    }).then(r => r.json()).then(data => {
        if (data.error) showToast(data.error, true);
        else { showToast('Đã duyệt tài khoản!'); renderAccountsPage(); }
    });
};

window.changeAccountRole = function(userId, currentRole) {
    const roleId = prompt('Nhập chức vụ mới (ADMIN, MARKETING, GIAO_VU, GIAO_VIEN):', currentRole);
    if (!roleId) return;
    
    fetch('/api/users/' + userId + '/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: roleId.toUpperCase() })
    }).then(r => r.json()).then(data => {
        if (data.error) showToast(data.error, true);
        else { showToast('Đã đổi quyền!'); renderAccountsPage(); }
    });
};

window.updateAccountStatus = function(userId, status) {
    if (!confirm('Xác nhận đổi trạng thái thành ' + status + '?')) return;
    fetch('/api/users/' + userId + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    }).then(r => r.json()).then(data => {
        if (data.error) showToast(data.error, true);
        else { showToast('Đã cập nhật trạng thái!'); renderAccountsPage(); }
    });
};


// --- NEW ACCOUNT MODAL LOGIC (V3.0) ---

window.openCreateAccountModal = function() {
    document.getElementById('account-modal').style.display = 'flex';
    document.querySelector('input[name="acc_type"][value="STAFF"]').checked = true;
    toggleAccType();
    
    document.getElementById('acc-staff-email').value = '';
    document.getElementById('acc-staff-role').value = 'GIAO_VIEN';
    
    document.getElementById('acc-student-id').value = '';
    document.getElementById('acc-student-name').value = '';
    document.getElementById('acc-student-pass').value = '';
    document.getElementById('acc-student-pass2').value = '';
    
    document.getElementById('acc-error').style.display = 'none';
};

window.closeAccountModal = function() {
    document.getElementById('account-modal').style.display = 'none';
};

window.toggleAccType = function() {
    const isStaff = document.querySelector('input[name="acc_type"]:checked').value === 'STAFF';
    document.getElementById('acc-staff-form').style.display = isStaff ? 'contents' : 'none';
    document.getElementById('acc-student-form').style.display = !isStaff ? 'contents' : 'none';
    document.getElementById('acc-submit-btn').textContent = isStaff ? 'Tạo yêu cầu' : 'Cấp tài khoản';
};

window.checkStudentId = async function() {
    const id = document.getElementById('acc-student-id').value.trim();
    if (!id) return;
    
    const errEl = document.getElementById('acc-error');
    errEl.style.display = 'none';
    
    try {
        const r = await fetch('/api/student-check/' + id);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi server');
        document.getElementById('acc-student-name').value = data.name;
    } catch (e) {
        document.getElementById('acc-student-name').value = '';
        errEl.textContent = e.message;
        errEl.style.display = 'block';
    }
};

window.submitAccountForm = async function() {
    const errEl = document.getElementById('acc-error');
    errEl.style.display = 'none';
    const isStaff = document.querySelector('input[name="acc_type"]:checked').value === 'STAFF';
    
    let payload = {};
    if (isStaff) {
        payload = {
            type: 'STAFF',
            email: document.getElementById('acc-staff-email').value.trim(),
            roleId: document.getElementById('acc-staff-role').value
        };
        if (!payload.email) return errEl.textContent = 'Vui lòng nhập Email', errEl.style.display = 'block';
    } else {
        const pass1 = document.getElementById('acc-student-pass').value;
        const pass2 = document.getElementById('acc-student-pass2').value;
        if (pass1 !== pass2) return errEl.textContent = 'Mật khẩu không khớp', errEl.style.display = 'block';
        if (pass1.length < 6) return errEl.textContent = 'Mật khẩu phải từ 6 ký tự', errEl.style.display = 'block';
        
        payload = {
            type: 'STUDENT',
            studentId: document.getElementById('acc-student-id').value.trim(),
            password: pass1
        };
        if (!payload.studentId) return errEl.textContent = 'Vui lòng nhập Mã học viên', errEl.style.display = 'block';
    }
    
    document.getElementById('acc-submit-btn').disabled = true;
    try {
        const r = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi tạo tài khoản');
        
        showToast(isStaff ? 'Đã tạo yêu cầu duyệt tài khoản!' : 'Đã cấp tài khoản học viên!');
        closeAccountModal();
        renderAccountsPage();
    } catch (e) {
        errEl.textContent = e.message;
        errEl.style.display = 'block';
    } finally {
        document.getElementById('acc-submit-btn').disabled = false;
    }
};

window.VS_VERSION = 'AUTO_DEPLOY_TEST_001';
