const _originalFetch = window.fetch.bind(window);
window.fetch = function(url, opts = {}) {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const token = localStorage.getItem('vs_token');
    if (token) {
      opts.headers = { ...(opts.headers || {}), 'Authorization': token };
    }
  }
  return _originalFetch(url, opts).then(res => {
    if (res.status === 401 && typeof url === 'string' && url.startsWith('/api/') && !url.includes('/auth/')) {
      VS_AUTH.logout();
    }
    return res;
  });
};

const VS_AUTH = {
  logout: () => {
    localStorage.removeItem('vs_token');
    location.reload();
  },

  check: async () => {
    const token = localStorage.getItem('vs_token');
    if (!token) {
      VS_AUTH.showLoginForm();
      return;
    }
    try {
      const r = await _originalFetch('/api/auth/me', { headers: { 'Authorization': token } });
      if (!r.ok) throw new Error();
      const user = await r.json();

      window.VS_DISPLAY_NAME = user.displayName || user.username;
      if (user.avatar) window.VS_AVATAR = user.avatar;
      
      const nameEl = document.getElementById('nav-username') || document.getElementById('sidebar-user-name');
      const roleEl = document.getElementById('nav-role') || document.getElementById('sidebar-user-role');
      
      const roleMap = {
        'ADMIN': 'Quản Trị Viên',
        'MARKETING': 'Marketing',
        'GIAO_VU': 'Giáo Vụ',
        'GIAO_VIEN': 'Giáo Viên',
        'HOC_VIEN': 'Học Viên'
      };
      
      if (nameEl) nameEl.textContent = window.VS_DISPLAY_NAME;
      if (roleEl) roleEl.textContent = roleMap[user.roleId] || user.roleId || user.role;
      
      if (window.VS_AVATAR) {
        const img = document.getElementById('nav-avatar-img');
        if (img) { img.src = window.VS_AVATAR; img.style.display = 'block'; }
        const txt = document.getElementById('nav-avatar-text');
        if (txt) txt.style.display = 'none';
      } else {
        const img = document.getElementById('nav-avatar-img');
        if (img) img.style.display = 'none';
        const txt = document.getElementById('nav-avatar-text');
        if (txt) { txt.textContent = window.VS_DISPLAY_NAME.substring(0,2).toUpperCase(); txt.style.display = 'flex'; }
      }

      window.VS_ROLE = user.roleId || user.role;
      window.VS_USER = user;

      const appEl = document.getElementById('vs-app');
      if (appEl) appEl.style.display = 'block';

      if (typeof window.applyRBAC === 'function') window.applyRBAC(window.VS_ROLE);
      if (typeof window.initAppAfterLogin === 'function') window.initAppAfterLogin();
    } catch {
      localStorage.removeItem('vs_token');
      VS_AUTH.showLoginForm();
    }
  },

  showLoginForm: () => {
    const appEl = document.getElementById('vs-app');
    if (appEl) appEl.style.display = 'none';

    const old = document.getElementById('vs-login-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vs-login-overlay';
    overlay.innerHTML = `
      <style>
        #vs-login-overlay {
          position:fixed;inset:0;z-index:99999;
          background:linear-gradient(135deg,#1a2f3a 0%,#234A5B 100%);
          display:flex;align-items:center;justify-content:center;
          font-family:'Be Vietnam Pro',sans-serif;
        }
        .vsl-card {
          background:#fff;border-radius:20px;padding:40px 36px;
          width:100%;max-width:380px;
          box-shadow:0 20px 60px rgba(0,0,0,0.4);
        }
        .vsl-logo { text-align:center;margin-bottom:28px; }
        .vsl-logo-badge {
          display:inline-flex;align-items:center;justify-content:center;
          width:52px;height:52px;border-radius:14px;
          background:linear-gradient(135deg,#234A5B,#2d5f75);
          font-size:13px;font-weight:900;color:#F69922;letter-spacing:1px;
          margin-bottom:10px;
        }
        .vsl-title { font-size:22px;font-weight:900;color:#234A5B;letter-spacing:1px;text-transform:uppercase; }
        .vsl-sub   { font-size:11px;color:#7a9aaa;margin-top:2px; }
        .vsl-divider {
            display: flex; align-items: center; text-align: center; color: #aaa; font-size: 11px; font-weight: 700; margin: 24px 0;
        }
        .vsl-divider::before, .vsl-divider::after {
            content: ''; flex: 1; border-bottom: 1px solid #eee;
        }
        .vsl-divider:not(:empty)::before { margin-right: .5em; }
        .vsl-divider:not(:empty)::after { margin-left: .5em; }
        .vsl-label { font-size:12px;font-weight:700;color:#234A5B;display:block;margin-bottom:6px; }
        .vsl-input {
          width:100%;border:1.5px solid #e0e0e0;border-radius:10px;
          padding:11px 14px;font-size:14px;font-family:'Be Vietnam Pro',sans-serif;
          outline:none;transition:border-color .2s;margin-bottom:16px;box-sizing:border-box;
        }
        .vsl-input:focus { border-color:#F69922; }
        .vsl-btn {
          width:100%;background:linear-gradient(135deg,#F69922,#e08515);
          color:#1a1a1a;border:none;border-radius:10px;
          padding:13px;font-size:14px;font-weight:700;cursor:pointer;
          font-family:'Be Vietnam Pro',sans-serif;transition:opacity .2s;
        }
        .vsl-btn:hover { opacity:0.88; }
        .vsl-btn:disabled { opacity:0.55;cursor:not-allowed; }
        .vsl-error {
          background:#fff0f0;border:1px solid #f5c6cb;color:#D94F4F;
          border-radius:8px;padding:10px 14px;font-size:12px;
          margin-bottom:14px;display:none;
        }
        #vsl-google-btn { display: flex; justify-content: center; }
      </style>
      <div class="vsl-card">
        <div class="vsl-logo">
          <div class="vsl-logo-badge">VS</div>
          <div class="vsl-title">VINSOUL ACADEMY</div>
          <div class="vsl-sub">Hệ Thống Quản Lý Nội Bộ V3.0</div>
        </div>
        
        <div id="vsl-error" class="vsl-error"></div>

        <div style="text-align:center; font-size: 12px; font-weight: 700; color: #234A5B; margin-bottom: 12px;">ĐĂNG NHẬP NHÂN SỰ</div>
        <div id="vsl-google-btn">
           <!-- Google Auth rendered here -->
           <div id="g_id_onload"
                data-client_id="mock-client-id"
                data-context="signin"
                data-ux_mode="popup"
                data-callback="handleGoogleLogin"
                data-auto_prompt="false">
           </div>
           <div class="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="outline"
                data-text="continue_with"
                data-size="large"
                data-logo_alignment="left">
           </div>
        </div>

        <div class="vsl-divider">HOẶC DÀNH CHO HỌC VIÊN</div>

        <form id="vsl-form">
          <label class="vsl-label">Mã học viên (VD: HV0001)</label>
          <input type="text" id="vsl-user" class="vsl-input" placeholder="Mã học viên" required autocomplete="username">
          <label class="vsl-label">Mật khẩu</label>
          <input type="password" id="vsl-pass" class="vsl-input" placeholder="Mật khẩu" required autocomplete="current-password">
          <button type="submit" id="vsl-submit" class="vsl-btn">Đăng Nhập Học Viên</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    window.handleGoogleLogin = async (response) => {
        const errorEl = document.getElementById('vsl-error');
        errorEl.style.display = 'none';
        if (!response.credential) return;

        try {
            const r = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await r.json();
            if (data.status === 'PENDING') {
                errorEl.textContent = data.message || 'Tài khoản đang chờ duyệt.';
                errorEl.style.display = 'block';
                return;
            }
            if (!r.ok) throw new Error(data.error || data.message || 'Đăng nhập Google thất bại');
            
            localStorage.setItem('vs_token', data.token);
            location.reload();
        } catch (e) {
            errorEl.textContent = e.message;
            errorEl.style.display = 'block';
        }
    };

    const form = document.getElementById('vsl-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('vsl-user').value;
      const p = document.getElementById('vsl-pass').value;
      const btn = document.getElementById('vsl-submit');
      const err = document.getElementById('vsl-error');
      
      btn.disabled = true;
      btn.textContent = 'Đang xử lý...';
      err.style.display = 'none';

      try {
        const r = await _originalFetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({username: u, password: p})
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi hệ thống');
        
        localStorage.setItem('vs_token', data.token);
        location.reload();
      } catch (ex) {
        err.textContent = ex.message;
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Đăng Nhập Học Viên';
      }
    });
  }
};

window.addEventListener('DOMContentLoaded', VS_AUTH.check);