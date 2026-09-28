
const staff = [
  { id: 1, name: 'Teacher A', role: 'teacher', baseSalary: 1000000, sessionRate: 200000, chuyenCan_2026_09: 50000 }
];
const classes = [
  { teacher: 'Teacher A', subject: 'Piano', schedule: [{day: 'Thứ 2', start: '18:00', end: '19:00'}] }
];
const window = { _staffAttCache: [
  { staffId: 1, date: '2026-09-07', checkIn: '17:50', checkOut: '19:10' },
  { staffId: 1, date: '2026-09-14', checkIn: '18:10', checkOut: '19:00' } // late
] };
function fmt(n) { return n; }
function editable(v) { return v; }
const document = { getElementById: (id) => id === 'pr-month' ? { value: '2026-09' } : { innerHTML: '' } };
function recalcPayroll() {
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
          let latestMin = -Infinity;
          classes.forEach(c => {
            if (c.teacher && s.name && c.teacher.toLowerCase().includes(s.name.toLowerCase())) {
              (c.schedule || []).forEach(sch => {
                const sDay = sch.day.replace(/Thứ |Thc /g, '');
                const tDay = dayStr.replace(/Thứ |Thc /g, '');
                if (sch.day === dayStr || sDay === tDay) {
                  const [ch, cm] = sch.start.split(':').map(Number);
                  const cMin = ch*60 + cm;
                  if (cMin < earliestMin) earliestMin = cMin;
                  
                  let defDur = 60;
                  if (c.subject && (c.subject.toLowerCase().includes('vẽ') || c.subject.toLowerCase().includes('cảm thụ âm nhạc'))) defDur = 90;
                  const duration = c.duration || defDur;
                  let endMin = cMin + Number(duration);
                  if (sch.end) {
                    const [eh, em] = sch.end.split(':').map(Number);
                    if (!isNaN(eh) && !isNaN(em)) endMin = eh * 60 + em;
                  }
                  if (endMin > latestMin) latestMin = endMin;
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
          if (latestMin !== -Infinity && a.checkOut) {
            const [h,m] = a.checkOut.split(':').map(Number);
            const checkOutMin = h*60+m;
            if (checkOutMin < latestMin) {
               lateMin += (latestMin - checkOutMin);
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

    const baseSalary = Number(s.salary || s.baseSalary || 0);
    const hourlyRate = Number(s.hourlyRate || s.wagePerHour || 0);
    const sessionRate = Number(s.sessionRate || s.wagePerSession || 0);

    let pay = baseSalary;
    if (hourlyRate > 0) pay += Math.round(totalMin / 60 * hourlyRate);
    if (sessionRate > 0) pay += workDays * sessionRate;

    const lateDeduct = lateMin * 1000;
    const finalPay = Math.max(0, pay - lateDeduct);

    return { s, workDays, totalMin, lateMin, lateDeduct, baseSalary, sessionRate, hourlyRate, pay, finalPay };
  });

  if (!rows.length) {
    content.innerHTML = `<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">Chưa có dữ liệu nhân sự. Vào <b>GV & Nhân Viên</b> để thêm nhân sự trước.</div></div>`;
    return;
  }

  const totalPayroll = rows.reduce((a,r) => a + r.finalPay, 0);

  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px;">
      <div class="stat-card"><div class="stat-value" style="color:var(--gold)">${fmt(totalPayroll)}</div><div class="stat-label">Tổng Chi Lương</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--navy)">${rows.length}</div><div class="stat-label">Nhân Viên</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#22c55e">${rows.reduce((a,r)=>a+r.workDays,0)}</div><div class="stat-label">Tổng Ngày Công</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#ef4444">${rows.reduce((a,r)=>a+r.lateMin,0)}</div><div class="stat-label">Tổng Phút Muộn</div></div>
    </div>
  `;

  window._payrollMonth = month;
  const tableRows = rows.map(({s,workDays,totalMin,lateMin,lateDeduct,baseSalary,sessionRate,hourlyRate,pay,finalPay}, index) => {
    const chuyenCan = Number(s['chuyenCan_' + window._payrollMonth] || 0);
    const viPham = lateDeduct + Number(s['customDeduct_' + window._payrollMonth] || 0);
    const finalTotal = Math.max(0, pay + chuyenCan - viPham);
    
    return `
    <tr>
      <td style="text-align:center;font-weight:600;color:var(--muted)">${index + 1}</td>
      <td style="font-weight:700;color:var(--navy)">${s.name}</td>
      <td style="color:var(--muted)">${s.role||'–'}</td>
      <td style="text-align:center"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--gold);"></td>
      <td style="text-align:right">${editable(baseSalary, 'salary', s.id, 'number')}</td>
      <td style="text-align:right">${editable(hourlyRate, 'hourlyRate', s.id, 'number')}</td>
      <td style="text-align:center">${Math.floor(totalMin/60)}h${totalMin%60?totalMin%60+'p':''}</td>
      <td style="text-align:right">${editable(sessionRate, 'sessionRate', s.id, 'number')}</td>
      <td style="text-align:center;font-weight:700;">${workDays}</td>
      <td style="text-align:right;color:#22c55e;font-weight:600">${editable(chuyenCan, 'chuyenCan_' + window._payrollMonth, s.id, 'number')}</td>
      <td style="text-align:right;color:#ef4444;font-weight:600">${editable(viPham, 'customDeduct_' + window._payrollMonth, s.id, 'number')}</td>
      <td style="text-align:right;font-weight:800;color:var(--gold);font-size:15px">${fmt(finalTotal)}</td>
      <td style="font-family:monospace;font-size:13px;">${s.bankAccount || ''}</td>
    </tr>
  `;
  }).join('');

  content.innerHTML = statsHtml + `
    <div style="background:#f0fdf4;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#166534;">
      💡 Bấm trực tiếp vào các ô <b>Lương CB, Rate/1h, Rate/1ca, Chuyên Cần, Vi Phạm</b> để tự động tính lại lương.
    </div>
    <div class="card">
      <div class="table-wrap">
        <table style="min-width:1100px; white-space:nowrap;">
          <thead>
            <tr>
              <th style="text-align:center;width:40px;">STT</th>
              <th>Họ và tên</th>
              <th>Chức vụ</th>
              <th style="text-align:center">XÁC NHẬN</th>
              <th style="text-align:right">Lương CB ✎</th>
              <th style="text-align:right">Rate/1h ✎</th>
              <th style="text-align:center">Số giờ</th>
              <th style="text-align:right">Rate/1ca ✎</th>
              <th style="text-align:center">Số ca</th>
              <th style="text-align:right">Chuyên cần ✎</th>
              <th style="text-align:right">Vi phạm ✎</th>
              <th style="text-align:right">Tổng lương</th>
              <th>STK Ngân Hàng</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr style="background:var(--cream2);">
              <td colspan="11" style="font-weight:800;color:var(--navy);text-align:right;padding:12px 14px;">TỔNG CHI LƯƠNG:</td>
              <td style="font-weight:800;color:var(--gold);font-size:16px;text-align:right;padding:12px 14px;">${fmt(rows.reduce((a,r) => a + Math.max(0, r.pay + Number(r.s['chuyenCan_'+window._payrollMonth]||0) - (r.lateDeduct + Number(r.s['customDeduct_'+window._payrollMonth]||0))), 0))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
  
  window._payrollCache = { month, rows };
}

recalcPayroll(); console.log("Success");