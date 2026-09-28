// ═══════════════════════════════════════════════════
//  attendance_ui.js – Giao diện Chấm công & Lương
// ═══════════════════════════════════════════════════

let videoStream = null;
let currentAttendanceType = 'checkin';

// Tạo Modal Chấm Công (Camera)
function openAttendanceModal(type) {
  currentAttendanceType = type;
  let m = document.getElementById('attendance-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'attendance-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(m);
  }
  
  m.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:400px;font-family:'Be Vietnam Pro',sans-serif;text-align:center;">
      <h3 style="margin-top:0;margin-bottom:16px;color:var(--navy);">
        ${type === 'checkin' ? '👋 Check-in Vào Làm' : '🏃 Check-out Ra Về'}
      </h3>
      
      <div style="position:relative;width:100%;aspect-ratio:3/4;background:#000;border-radius:12px;overflow:hidden;margin-bottom:16px;">
        <video id="attendance-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video>
        <canvas id="attendance-canvas" style="display:none;"></canvas>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="btn-capture-attendance" class="btn btn-gold" style="flex:1;">📸 Chụp Ảnh & Lưu</button>
        <button id="btn-close-attendance" class="btn btn-outline" style="flex:1;">Hủy</button>
      </div>
      
      <p style="font-size:11px;color:#666;margin-top:12px;line-height:1.4;">
        Vui lòng cho phép truy cập Camera để chụp ảnh xác thực khuôn mặt.
      </p>
    </div>
  `;
  m.style.display = 'flex';
  
  // Khởi động Camera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        videoStream = stream;
        document.getElementById('attendance-video').srcObject = stream;
      })
      .catch(err => {
        showToast('Không thể mở Camera! Vui lòng cấp quyền.', true);
      });
  } else {
    showToast('Trình duyệt không hỗ trợ Camera (Cần truy cập qua HTTPS)', true);
  }

  // Sự kiện nút
  document.getElementById('btn-close-attendance').onclick = closeAttendanceModal;
  document.getElementById('btn-capture-attendance').onclick = captureAndSubmitAttendance;
}

function closeAttendanceModal() {
  const m = document.getElementById('attendance-modal');
  if (m) m.style.display = 'none';
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

async function captureAndSubmitAttendance() {
  const video = document.getElementById('attendance-video');
  const canvas = document.getElementById('attendance-canvas');
  if (!video || !videoStream) return showToast('Camera chưa sẵn sàng', true);
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Nén ảnh lại 60%
  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
  
  closeAttendanceModal();
  showToast('Đang xử lý...', false);

  try {
    const payload = {
      staffId: window.VS_ROLE === 'teacher' ? window.VS_USER.linkedStaffId : window.VS_USER.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0,5),
      type: currentAttendanceType,
      method: 'camera',
      photo: dataUrl
    };

    // Note: Thực tế cần logic lấy shiftId / classId hiện tại.
    // Tạm thời truyền lên, server sẽ xử lý
    
    const r = await fetch('/api/staff-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vs_token') },
      body: JSON.stringify(payload)
    });
    
    const data = await r.json();
    if (r.ok) {
      showToast(currentAttendanceType === 'checkin' ? 'Đã Check-in thành công!' : 'Đã Check-out thành công!');
      if (typeof window.renderStaffAttendancePage === 'function') window.renderStaffAttendancePage();
    } else {
      showToast(data.error || 'Lỗi chấm công');
    }
  } catch (e) {
    showToast('Lỗi kết nối server', true);
  }
}

// ──────────────────────────────────────────────
// Giao diện Quản Lý Lương (Payroll)
// ──────────────────────────────────────────────
function renderPayrollPage() {
  document.getElementById('page-title').textContent = 'Bảng Lương & Chấm Công';
  const main = document.querySelector('.main-content');
  if (!main) return;
  
  // Tạm giao diện Skeleton, sẽ call API /api/payroll sau
  main.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);font-family:'Be Vietnam Pro',sans-serif;">
      <h2 style="margin:0 0 16px;color:var(--navy);">Bảng Lương Tổng Hợp</h2>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <input type="month" id="payroll-month" value="${new Date().toISOString().substring(0,7)}" style="padding:8px 12px;border:1.5px solid var(--cream2);border-radius:8px;font-family:inherit;">
        <button class="btn btn-gold" onclick="loadPayrollData()">Xem Bảng Lương</button>
      </div>
      <div id="payroll-results"></div>
    </div>
  `;
  loadPayrollData();
}

async function loadPayrollData() {
  const m = document.getElementById('payroll-month').value;
  if (!m) return;
  const res = document.getElementById('payroll-results');
  res.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Đang tải dữ liệu...</div>';
  
  try {
    const r = await fetch(`/api/payroll?month=${m}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vs_token') }
    });
    if (!r.ok) throw new Error('Failed to load payroll');
    const data = await r.json();
    
    // Render Giáo Viên
    let html = `<h3 style="color:var(--navy);border-bottom:2px solid var(--gold);padding-bottom:8px;display:inline-block;">1. Lương Giáo Viên</h3>`;
    html += `<div style="overflow-x:auto;margin-bottom:30px;"><table class="vs-table">
      <tr><th>Giáo viên</th><th>Bộ môn</th><th>Tổng giờ dạy</th><th>Đi muộn</th><th>Đơn giá</th><th>Tổng lương</th></tr>`;
    
    if (data.teacherPayroll && data.teacherPayroll.length > 0) {
      data.teacherPayroll.forEach(t => {
        const subjects = Object.entries(t.subjectBreakdown).map(([k,v]) => `${k} (${v}h)`).join(', ');
        html += `<tr>
          <td><strong>${t.name}</strong></td>
          <td><span style="font-size:12px;background:var(--cream);padding:4px 8px;border-radius:12px;">${subjects}</span></td>
          <td>${t.totalTeachingHours} giờ</td>
          <td style="color:${t.totalLateMins > 0 ? '#ef4444' : '#10b981'}">${t.totalLateMins} phút (${t.lateDays} lần)</td>
          <td>${t.rate.toLocaleString('vi-VN')} đ/h</td>
          <td style="color:var(--navy);font-weight:700;">${t.salary.toLocaleString('vi-VN')} đ</td>
        </tr>`;
      });
    } else {
      html += `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Chưa có dữ liệu giáo viên tháng này</td></tr>`;
    }
    html += `</table></div>`;
    
    // Render Nhân Viên
    html += `<h3 style="color:var(--navy);border-bottom:2px solid var(--gold);padding-bottom:8px;display:inline-block;">2. Lương Nhân Viên Hành Chính</h3>`;
    html += `<div style="overflow-x:auto;"><table class="vs-table">
      <tr><th>Nhân viên</th><th>Lương Cơ Bản</th><th>Giờ làm</th><th>OT (Thưởng)</th><th>Phạt đi muộn</th><th>Thực Nhận</th></tr>`;
      
    if (data.staffPayroll && data.staffPayroll.length > 0) {
      data.staffPayroll.forEach(s => {
        html += `<tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.baseSalary.toLocaleString('vi-VN')} đ</td>
          <td>${s.totalHours} giờ</td>
          <td style="color:#10b981;">+${s.otSalary.toLocaleString('vi-VN')} đ</td>
          <td style="color:#ef4444;">-${s.latePenalty.toLocaleString('vi-VN')} đ</td>
          <td style="color:var(--navy);font-weight:700;">${s.salary.toLocaleString('vi-VN')} đ</td>
        </tr>`;
      });
    } else {
      html += `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Chưa có dữ liệu nhân viên tháng này</td></tr>`;
    }
    html += `</table></div>`;
    
    res.innerHTML = html;
  } catch (e) {
    res.innerHTML = '<div style="color:#ef4444;text-align:center;">Lỗi tải bảng lương</div>';
  }
}
