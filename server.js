// ═══════════════════════════════════════════════════
//  server.js – Vinsoul Academy v3.0
// ═══════════════════════════════════════════════════
require('dotenv').config();

const { OAuth2Client } = require('google-auth-library');
// Replace with your real client ID later
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock-client-id';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function loadRBAC() {
  try { return JSON.parse(fs.readFileSync(path.join(APP_DIR, 'rbac.json'), 'utf8')); }
  catch (e) { return { roles: [], permissions: [], rolePermissions: [] }; }
}
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const XLSX    = require('xlsx');

const app    = express();
app.set('trust proxy', 1); // Trust first proxy (LiteSpeed/Nginx) – required for express-rate-limit behind reverse proxy
// Ensure absolute path resolution regardless of working directory
const APP_DIR = path.resolve(process.cwd());
const NEWS_MEDIA_DIR = path.join(APP_DIR, 'news_media');
if (!fs.existsSync(NEWS_MEDIA_DIR)) fs.mkdirSync(NEWS_MEDIA_DIR, { recursive: true });

const PORT   = process.env.PORT || 3000;
const DB     = path.join(path.resolve(process.cwd()), 'database.json');
const USERS  = path.join(path.resolve(process.cwd()), 'users.json');
const AUDIT  = path.join(path.resolve(process.cwd()), 'audit.json');
const SECRET = process.env.JWT_SECRET || 'vinsoul_secret_key_2025_fallback_warning';

// ── Global safe date helpers (prevents "Invalid time value" errors) ──
function safeDate(val) {
  if (!val && val !== 0) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
function safeFd(val) {
  const d = safeDate(val);
  return d ? d.toLocaleDateString('vi-VN') : '';
}

const BANK   = { bin:'970436', account:'1731238888', name:'HKD VINSOUL' };

// Vietnamese holidays (MM-DD fixed) + Tet by year
const FIXED_HOLIDAYS = ['01-01','04-30','05-01','09-02'];
const TET_HOLIDAYS = {
  '2025':['2025-01-27','2025-01-28','2025-01-29','2025-01-30','2025-01-31','2025-02-01','2025-02-02'],
  '2026':['2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21'],
  '2027':['2027-02-05','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-02-10','2027-02-11'],
};

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers, disable CSP to not break inline styles/scripts
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

['server.js','users.json','database.json','audit.json'].forEach(f => {
  app.get('/'+f, (_,res) => res.status(403).end());
});
app.use('/backups', (req, res) => res.status(403).end());

// ── DB ──
const EMPTY = {
  students:[], staff:[], leads:[], classes:[], attendance:[],
  makeups:[], templates:[], customCourses:[], customPrices:{},
  notifications:[], zaloCfg:{}, staffAttendance:[], expenses:[], staffRoles:[]
};
function loadDB() {
  let db = { ...EMPTY };
  try { 
    db = { ...EMPTY, ...JSON.parse(fs.readFileSync(DB,'utf8')) }; 
  } catch (e) {}

  // Ensure admin is in staff
  if (!db.staff) db.staff = [];
  const adminStaff = db.staff.find(s => (s.name || '').toLowerCase() === 'admin');
  if (!adminStaff) {
    db.staff.push({
      id: 1, // Fixed ID for admin
      vsId: 'ADMIN',
      name: 'Admin',
      dob: '',
      phone: '',
      role: 'Chủ Tịch',
      status: 'Đang hoạt động',
      note: 'Tài khoản quản trị viên tối cao'
    });
    // Save it back implicitly because any saveDB operation will write this
  } else {
    // Ensure role is correctly named
    if (adminStaff.role !== 'Chủ Tịch') adminStaff.role = 'Chủ Tịch';
  }

  return db;
}
function saveDB(d) {
  fs.writeFileSync(DB+'.tmp', JSON.stringify(d,null,2));
  fs.renameSync(DB+'.tmp', DB);
}

// ── USERS ──
function loadUsers() {
  if (!fs.existsSync(USERS)) {
    const def = [{id:1,username:'admin',passwordHash:bcrypt.hashSync('Vinsoul@2026Secure',10),displayName:'Quản Trị Viên',role:'admin'}];
    fs.writeFileSync(USERS, JSON.stringify(def,null,2));
    return def;
  }
  try {
    const users = JSON.parse(fs.readFileSync(USERS,'utf8'));
    if (!users.find(u => u.username === 'admin')) {
      users.push({ id: 1, username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), displayName: 'Admin', role: 'admin' });
      fs.writeFileSync(USERS, JSON.stringify(users, null, 2));
    } else {
      const adminIdx = users.findIndex(u => u.username === 'admin');
      if (adminIdx !== -1 && !users[adminIdx].id) {
        users[adminIdx].id = 1;
        fs.writeFileSync(USERS, JSON.stringify(users, null, 2));
      }
    }
    return users;
  }
  catch { return []; }
}
function saveUsers(u) { fs.writeFileSync(USERS, JSON.stringify(u,null,2)); }

// ── AUDIT ──
function audit(user, action, detail) {
  try {
    let logs = [];
    try { logs = JSON.parse(fs.readFileSync(AUDIT,'utf8')); } catch {}
    logs.unshift({id:Date.now(),user,action,detail:typeof detail==='object'?JSON.stringify(detail):String(detail||''),time:new Date().toISOString()});
    if (logs.length > 2000) logs.splice(2000);
    fs.writeFileSync(AUDIT, JSON.stringify(logs,null,2));
  } catch {}
}

// ── RATE LIMIT ──
const tries = new Map();
function locked(ip) {
  const r = tries.get(ip); if(!r) return false;
  if(Date.now()>r.reset){tries.delete(ip);return false;}
  return r.n>=5;
}
function fail(ip) {
  const r = tries.get(ip)||{n:0,reset:Date.now()+900000};
  if(Date.now()>r.reset){r.n=0;r.reset=Date.now()+900000;}
  r.n++; tries.set(ip,r);
}

// ── MIDDLEWARE ──
function authMw(req, res, next) {
  let t = req.query.token;
  if (!t) {
    const h = req.headers['authorization'] || '';
    t = h.startsWith('Bearer ') ? h.slice(7) : h;
  }
  if (!t) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(t, SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    
    // Check status
    if (user.status === 'PENDING') return res.status(403).json({ error: 'PENDING', message: 'Tài khoản đang chờ duyệt' });
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Tài khoản bị khóa' });

    // Attach permissions
    const rbac = loadRBAC();
    const roleId = user.roleId || 'TEACHER'; // default fallback
    const role = rbac.roles.find(r => r.id === roleId);
    if (role && role.isSystem) {
       req.user.permissions = rbac.permissions.map(p => p.id); // ALL
    } else {
       req.user.permissions = rbac.rolePermissions.filter(rp => rp.roleId === roleId).map(rp => rp.permissionId);
    }
    req.user.roleId = roleId;
    
    next();
  }
  catch (e) { res.status(401).json({ error: 'Phiên đăng nhập hết hạn' }); }
}

function requirePermission(perm) {
  return (req, res, next) => {
    if (req.user && req.user.permissions && req.user.permissions.includes(perm)) {
      next();
    } else {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện hành động này' });
    }
  };
}

function adminOnly(req, res, next) {
   // Legacy fallback - map to specific permissions if possible
   if (req.user && req.user.roleId === 'ADMIN') {
       next();
   } else {
       res.status(403).json({ error: 'FORBIDDEN' });
   }
}

function staffUp(req, res, next) {
    // Legacy fallback
    if (req.user && req.user.permissions && req.user.permissions.includes('student.view')) {
        next();
    } else {
        res.status(403).json({ error: 'FORBIDDEN' });
    }
}
function teacherUp(req, res, next) {
    next();
}

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút' }
});


app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    let payload;
    if (GOOGLE_CLIENT_ID === 'mock-client-id') {
       const decoded = jwt.decode(credential);
       if (!decoded || !decoded.email) throw new Error("Invalid mock token");
       payload = decoded;
    } else {
       const ticket = await googleClient.verifyIdToken({
           idToken: credential,
           audience: GOOGLE_CLIENT_ID,
       });
       payload = ticket.getPayload();
    }
    
    const { sub: googleId, email, name, picture } = payload;
    
    const users = loadUsers();
    let user = users.find(u => u.email === email || u.googleId === googleId);
    
    if (!user) {
        user = {
            id: Date.now(),
            googleId,
            email,
            username: email.split('@')[0],
            displayName: name,
            avatar: picture,
            roleId: null,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        audit('SYSTEM', 'USER_REGISTER', `Google Auth: ${email}`);
    } else {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        user.lastLoginAt = new Date().toISOString();
        saveUsers(users);
    }
    
    if (user.status === 'PENDING') {
        return res.json({ status: 'PENDING', message: 'Tài khoản đang chờ phê duyệt' });
    }
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Tài khoản bị khóa' });
    }
    
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roleId: user.roleId
    }, SECRET, { expiresIn: '30d' });
    
    audit(user.username, 'LOGIN', 'Đăng nhập qua Google');
    res.json({ token, user: { id: user.id, displayName: user.displayName, email: user.email, roleId: user.roleId, avatar: user.avatar } });
  } catch (error) {
    console.error('[AUTH GOOGLE]', error);
    res.status(401).json({ error: 'Đăng nhập Google thất bại' });
  }
});
app.post('/api/auth/login', loginLimiter, (req,res) => {
  const ip = req.ip||'';
  if(locked(ip)) return res.status(429).json({error:'Tạm khóa do đăng nhập sai nhiều lần'});
  const {username='',password=''} = req.body||{};
  const users = loadUsers();
  const user  = users.find(u=>u.username===username.trim().toLowerCase());
  if(!user||!bcrypt.compareSync(password,user.passwordHash)) {
    fail(ip);
    const r=tries.get(ip);
    return res.status(401).json({error:`Sai tên đăng nhập hoặc mật khẩu. Còn ${Math.max(0,5-(r?r.n:1))} lần thử.`});
  }
  tries.delete(ip);
  audit(user.username,'LOGIN','Đăng nhập thành công');
  if (user.roleId !== 'HOC_VIEN') return res.status(403).json({error:'Nhân sự vui lòng đăng nhập bằng Google'});
  const token = jwt.sign({id:user.id,username:user.username,displayName:user.displayName,roleId:user.roleId,studentId:user.studentId},SECRET,{expiresIn:'30d'});
  res.json({token,username:user.username,displayName:user.displayName,role:user.role,avatar:user.avatar||null,linkedStaffId:user.linkedStaffId||null,linkedStudentId:user.linkedStudentId||null});
});

app.get('/api/auth/me', authMw, (req,res) => {
  const users = loadUsers();
  const u = users.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({error:'Not found'});
  
  const db = loadDB();
  let phone='', email='', bankName='', bankAccount='';
  if (u.linkedStaffId && db.staff) {
    const st = db.staff.find(s => String(s.id) === String(u.linkedStaffId));
    if (st) { phone = st.phone||''; email = st.email||''; bankName = st.bankName||''; bankAccount = st.bankAccount||''; }
  } else if (u.linkedStudentId && db.students) {
    const st = db.students.find(s => String(s.id) === String(u.linkedStudentId));
    if (st) { phone = st.phone||''; email = st.email||''; bankName = st.bankName||''; bankAccount = st.bankAccount||''; }
  }
  
  res.json({
    username:u.username,
    displayName:u.displayName,
    role:u.role,
    avatar:u.avatar||null,
    linkedStaffId:u.linkedStaffId,
    linkedStudentId:u.linkedStudentId,
    phone, email, bankName, bankAccount
  });
});

app.post('/api/auth/update-profile', authMw, (req,res) => {
  try {
  const { displayName, avatar, currentPassword, newPassword, phone, email, bankName, bankAccount } = req.body || {};
  const users = loadUsers();
  const i = users.findIndex(u => u.id === req.user.id);
  if (i === -1) return res.status(404).json({error:'Không tìm thấy tài khoản'});

  if (currentPassword && newPassword) {
    if (!bcrypt.compareSync(currentPassword, users[i].passwordHash)) return res.status(400).json({error:'Mật khẩu hiện tại không đúng'});
    if (newPassword.length < 8) return res.status(400).json({error:'Mật khẩu mới ít nhất 8 ký tự'});
    users[i].passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  if (displayName) users[i].displayName = displayName.trim();
  
  if (avatar && avatar.startsWith('data:image')) {
    const ext = avatar.includes('png') ? 'png' : 'jpg';
    const fname = `avatar_${users[i].id}_${Date.now()}.${ext}`;
    const base64 = avatar.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(path.join(NEWS_MEDIA_DIR, fname), Buffer.from(base64, 'base64'));
    users[i].avatar = `/news_media/${fname}`;
  }

  const db = loadDB();
  if (users[i].linkedStaffId && db.staff) {
    const sIdx = db.staff.findIndex(s => String(s.id) === String(users[i].linkedStaffId));
    if (sIdx !== -1) {
      if (phone !== undefined) db.staff[sIdx].phone = phone;
      if (email !== undefined) db.staff[sIdx].email = email;
      if (bankName !== undefined) db.staff[sIdx].bankName = bankName;
      if (bankAccount !== undefined) db.staff[sIdx].bankAccount = bankAccount;
      if (displayName !== undefined) db.staff[sIdx].name = displayName;
      if (users[i].avatar) db.staff[sIdx].avatar = users[i].avatar;
    }
  } else if (users[i].linkedStudentId && db.students) {
    const sIdx = db.students.findIndex(s => String(s.id) === String(users[i].linkedStudentId));
    if (sIdx !== -1) {
      if (phone !== undefined) db.students[sIdx].phone = phone;
      if (email !== undefined) db.students[sIdx].email = email;
      if (bankName !== undefined) db.students[sIdx].bankName = bankName;
      if (bankAccount !== undefined) db.students[sIdx].bankAccount = bankAccount;
      if (displayName !== undefined) db.students[sIdx].name = displayName;
      if (users[i].avatar) db.students[sIdx].avatar = users[i].avatar;
    }
  }
  saveDB(db);

  saveUsers(users);
  audit(users[i].username, 'UPDATE_PROFILE', 'Cập nhật hồ sơ cá nhân');
  res.json({ok:true, displayName: users[i].displayName, avatar: users[i].avatar, phone, email, bankName, bankAccount});
  } catch(e) {
    console.error('Update profile error:', e);
    res.status(500).json({error: String(e.message || e)});
  }
});

app.post('/api/auth/change-password', authMw, (req,res) => {
  const {currentPassword='',newPassword=''} = req.body||{};
  if(!currentPassword||!newPassword) return res.status(400).json({error:'Vui lòng nhập đủ thông tin'});
  if(newPassword.length<8) return res.status(400).json({error:'Mật khẩu mới phải có ít nhất 8 ký tự'});
  const users=loadUsers();
  const i=users.findIndex(u=>u.id===req.user.id);
  if(i===-1) return res.status(404).json({error:'Không tìm thấy tài khoản'});
  if(!bcrypt.compareSync(currentPassword,users[i].passwordHash)) return res.status(401).json({error:'Mật khẩu hiện tại không đúng'});
  users[i].passwordHash=bcrypt.hashSync(newPassword,10);
  saveUsers(users);
  audit(req.user.username,'CHANGE_PASSWORD','Đổi mật khẩu thành công');
  res.json({ok:true});
});

// ══════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════
app.get('/api/users', authMw, requirePermission('staff.view'), (req,res) => {
  res.json(loadUsers().map(u=>({id:u.id,username:u.username,displayName:u.displayName,role:u.role,linkedStaffId:u.linkedStaffId,linkedStudentId:u.linkedStudentId})));
});


app.get('/api/student-check/:id', authMw, (req, res) => {
    const db = loadDB();
    const sid = req.params.id.toUpperCase();
    const student = (db.students || []).find(s => String(s.vsId || s.id).toUpperCase() === sid);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy học viên có mã này' });
    res.json({ name: student.name });
});

app.post('/api/users', authMw, (req, res) => {
    // Only Admin can create STAFF, GIAO_VU/ADMIN can create STUDENT
    if (req.body.type === 'STAFF' && req.user.roleId !== 'ADMIN') return res.status(403).json({ error: 'Chỉ Admin mới có quyền' });
    
    const users = loadUsers();
    
    if (req.body.type === 'STAFF') {
        const { email, roleId } = req.body;
        if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email đã tồn tại trong hệ thống' });
        
        const u = {
            id: Date.now(),
            loginType: 'GOOGLE',
            email: email,
            username: email.split('@')[0],
            displayName: email.split('@')[0],
            roleId: roleId,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        users.push(u);
        saveUsers(users);
        audit(req.user.username, 'CREATE_USER', 'Tạo tài khoản STAFF chờ duyệt: ' + email);
        return res.json({ ok: true });
    } 
    else if (req.body.type === 'STUDENT') {
        const db = loadDB();
        const sid = req.body.studentId.toUpperCase();
        const student = (db.students || []).find(s => String(s.vsId || s.id).toUpperCase() === sid);
        if (!student) return res.status(404).json({ error: 'Không tìm thấy học viên' });
        
        if (users.find(u => u.studentId === sid)) return res.status(409).json({ error: 'Học viên này đã có tài khoản' });
        
        const u = {
            id: Date.now(),
            loginType: 'STUDENT',
            studentId: sid,
            username: sid,
            displayName: student.name,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            roleId: 'HOC_VIEN',
            status: 'APPROVED',
            createdAt: new Date().toISOString()
        };
        users.push(u);
        saveUsers(users);
        audit(req.user.username, 'CREATE_USER', 'Tạo tài khoản HOC_VIEN: ' + sid);
        return res.json({ ok: true });
    }
    res.status(400).json({ error: 'Invalid type' });
});


app.put('/api/users/:id', authMw, requirePermission('staff.update'), (req,res) => {
  const id=Number(req.params.id);
  const {displayName,role,password,linkedStaffId,linkedStudentId}=req.body||{};
  const users=loadUsers();
  const i=users.findIndex(u=>u.id===id);
  if(i===-1) return res.status(404).json({error:'Không tìm thấy tài khoản'});
  if(users[i].id===req.user.id&&role&&role!=='admin') return res.status(400).json({error:'Không thể hạ cấp quyền của chính mình'});
  if(displayName) users[i].displayName=displayName.trim();
  if(role&&['admin','staff','teacher','student','marketing'].includes(role)) users[i].role=role;
  if(linkedStaffId!==undefined) users[i].linkedStaffId=linkedStaffId||null;
  if(linkedStudentId!==undefined) users[i].linkedStudentId=linkedStudentId||null;
  if(password){if(password.length<8) return res.status(400).json({error:'Mật khẩu phải có ít nhất 8 ký tự'});users[i].passwordHash=bcrypt.hashSync(password,10);}
  saveUsers(users);
  audit(req.user.username,'UPDATE_USER',`Cập nhật TK ID:${id}`);
  res.json({ok:true});
});

app.delete('/api/users/:id', authMw, requirePermission('staff.delete'), (req,res) => {
  const id=Number(req.params.id);
  if(id===req.user.id) return res.status(400).json({error:'Không thể xóa tài khoản của chính mình'});
  const users=loadUsers();
  const i=users.findIndex(u=>u.id===id);
  if(i===-1) return res.status(404).json({error:'Không tìm thấy'});
  if(users[i].roleId === 'ADMIN'&&users.filter((_,j)=>j!==i&&_.roleId === 'ADMIN').length===0) return res.status(400).json({error:'Phải còn ít nhất 1 quản trị viên'});
  const uname=users[i].username; users.splice(i,1); saveUsers(users);
  audit(req.user.username,'DELETE_USER',`Xóa TK: ${uname}`);
  res.json({ok:true});
});

// ══════════════════════════════════════
// DATA LOAD / SAVE (role-filtered)
// ══════════════════════════════════════
app.get('/api/load', authMw, (req,res) => {
  const db=loadDB();
  const {roleId, studentId, linkedStaffId} = req.user;

  if(roleId === 'HOC_VIEN') {
    const sid = studentId;
    const myS=(db.students||[]).filter(s=>String(s.id)===String(sid) || (s.vsId && String(s.vsId).toUpperCase()===String(sid).toUpperCase()));
    return res.json({
      students:myS,
      attendance:(db.attendance||[]).filter(a=>myS.some(ms=>a.records&&a.records[String(ms.id)])),
      makeups:(db.makeups||[]).filter(m=>myS.some(ms=>String(m.studentId)===String(ms.id))),
      classes:[], staff:[], leads:[], customCourses:db.customCourses, customPrices:db.customPrices
    });
  }

  if(roleId === 'GIAO_VIEN') {
    const staffMember=(db.staff||[]).find(s=>String(s.id)===String(linkedStaffId));
    const teacherName=staffMember?staffMember.name:req.user.displayName;
    const myClasses=(db.classes||[]).filter(c=>c.teacher&&c.teacher.includes(teacherName));
    const myClassIds=myClasses.map(c=>String(c.id));
    const myStudents=(db.students||[]).filter(s=>myClassIds.includes(String(s.classid)));
    return res.json({...db, students:myStudents, classes:myClasses, leads:[], staffAttendance:(db.staffAttendance||[]).filter(a=>String(a.staffId)===String(linkedStaffId))});
  }

  res.json(db);
});

app.post('/api/save', authMw, (req,res) => {
  try {
    const db=loadDB();
    const {roleId, studentId}=req.user;

    if(roleId === 'HOC_VIEN') {
      const sid = req.user.studentId;
      if(req.body.studentShare!==undefined&&sid) {
        const idx=(db.students||[]).findIndex(s=>String(s.id)===String(sid) || (s.vsId && String(s.vsId).toUpperCase()===String(sid).toUpperCase()));
        if(idx!==-1){db.students[idx].studentShare=req.body.studentShare;saveDB(db);return res.json({ok:true});}
      }
      return res.status(403).json({error:'Không có quyền lưu'});
    }

    let allowedKeys = [];
    if(roleId === 'ADMIN') allowedKeys = Object.keys(EMPTY);
    else if(roleId === 'MARKETING') allowedKeys = ['students','leads','classes','notifications','customCourses','customPrices'];
    else if(roleId === 'GIAO_VU') allowedKeys = ['students','leads','classes','attendance','makeups','notifications','customCourses','customPrices','staffRoles','expenses','inventory','exams'];
    else if(roleId === 'GIAO_VIEN') allowedKeys = ['students','classes','attendance','makeups','notifications','exams'];

    Object.keys(EMPTY).forEach(k=>{
      if(allowedKeys.includes(k) && req.body[k]!==undefined) {
        db[k]=req.body[k];
      }
    });
    saveDB(db);
    if(req.body.students) audit(req.user.username,'SAVE_STUDENTS',`${(req.body.students||[]).length} học viên`);
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── Student feedback ──
app.post('/api/student/:id/feedback', authMw, teacherUp, (req,res) => {
  const db=loadDB();
  const idx=(db.students||[]).findIndex(s=>String(s.id)===String(req.params.id));
  if(idx===-1) return res.status(404).json({error:'Không tìm thấy học viên'});
  if(!db.students[idx].feedbacks) db.students[idx].feedbacks=[];
  const entry={id:Date.now(),by:req.user.displayName,byRole:req.user.roleId,at:new Date().toISOString(),feedback:req.body.feedback||'',homework:req.body.homework||'',mediaUrls:req.body.mediaUrls||[]};
  db.students[idx].feedbacks.push(entry);
  saveDB(db);
  audit(req.user.username,'FEEDBACK',`HV ${req.params.id}`);
  res.json({ok:true,entry});
});

app.post('/api/student/:id/share', authMw, (req,res) => {
  const db=loadDB();
  const sid=req.params.id;
  if(req.user.roleId === 'HOC_VIEN'&&String(req.user.linkedStudentId)!==String(sid)) return res.status(403).json({error:'Không có quyền'});
  const idx=(db.students||[]).findIndex(s=>String(s.id)===String(sid) || (s.vsId && String(s.vsId).toUpperCase()===String(sid).toUpperCase()));
  if(idx===-1) return res.status(404).json({error:'Không tìm thấy'});
  db.students[idx].studentShare=req.body.share||'';
  saveDB(db);
  res.json({ok:true});
});

// ── Staff attendance (giáo viên tự chấm công) ──
const PHOTO_DIR = path.join(path.resolve(process.cwd()), 'attendance_photos');
if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });

// === QUẢN LÝ CHẤM CÔNG & TÍNH LƯƠNG ===

function calculateLateness(checkTime, expectedTime) {
  if (!checkTime || !expectedTime) return 0;
  const [cHour, cMin] = checkTime.split(':').map(Number);
  const [eHour, eMin] = expectedTime.split(':').map(Number);
  const diff = (cHour * 60 + cMin) - (eHour * 60 + eMin);
  return diff > 0 ? diff : 0;
}

app.post('/api/staff-attendance', authMw, (req, res) => {
  const db = loadDB();
  const { staffId, date, time, type, method, photo, latenessRefTime, shiftId } = req.body || {}; // type: 'checkin' | 'checkout'
  if (req.user.roleId === 'GIAO_VIEN' && String(req.user.linkedStaffId) !== String(staffId))
    return res.status(403).json({ error: 'Chỉ được chấm công cho chính mình' });
  if (!db.staffAttendance) db.staffAttendance = [];

  let photoPath = null;
  if (photo && photo.startsWith('data:image')) {
    try {
      const dayDir = path.join(PHOTO_DIR, date || 'unknown');
      if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
      const base64 = photo.replace(/^data:image\/\w+;base64,/, '');
      const filename = `${staffId}_${type}_${Date.now()}.jpg`;
      fs.writeFileSync(path.join(dayDir, filename), Buffer.from(base64, 'base64'));
      photoPath = `/attendance_photos/${date}/${filename}`;
    } catch (e) { console.error('Photo save error:', e.message); }
  }

  const existing = db.staffAttendance.findIndex(a => String(a.staffId) === String(staffId) && a.date === date);
  const prevEntry = existing !== -1 ? db.staffAttendance[existing] : {
    id: Date.now(), staffId, date, checkIn: null, checkOut: null, method: method || 'camera', note: ''
  };

  if (type === 'checkin') {
    prevEntry.checkIn = time;
    prevEntry.checkInImage = photoPath;
    if (latenessRefTime) {
      prevEntry.lateMinutes = calculateLateness(time, latenessRefTime);
      prevEntry.shiftId = shiftId || null;
    }
  } else if (type === 'checkout') {
    prevEntry.checkOut = time;
    prevEntry.checkOutImage = photoPath;
    if (prevEntry.checkIn) {
      const [iH, iM] = prevEntry.checkIn.split(':').map(Number);
      const [oH, oM] = time.split(':').map(Number);
      prevEntry.workingHours = ((oH * 60 + oM) - (iH * 60 + iM)) / 60;
    }
  } else {
    // Old manual checkin fallback
    if (req.body.checkIn !== undefined) {
      if (!prevEntry.checkIn && req.body.checkIn) prevEntry.checkInImage = photoPath;
      prevEntry.checkIn = req.body.checkIn;
    }
    if (req.body.checkOut !== undefined) {
      if (req.body.checkOut) prevEntry.checkOutImage = photoPath;
      prevEntry.checkOut = req.body.checkOut;
    }
    if (req.body.note !== undefined) prevEntry.note = req.body.note;
    if (req.body.method !== undefined) prevEntry.method = req.body.method;
  }
  
  prevEntry.updatedAt = new Date().toISOString();

  if (existing !== -1) db.staffAttendance[existing] = prevEntry;
  else db.staffAttendance.push(prevEntry);
  saveDB(db);
  audit(req.user.username, 'STAFF_ATTENDANCE', `${staffId} ${date} ${type}`);
  res.json({ ok: true, entry: prevEntry });
});

app.get('/api/shifts', authMw, (req, res) => {
  const db = loadDB();
  res.json(db.shifts || []);
});

app.post('/api/shifts', authMw, (req, res) => {
  const db = loadDB();
  if (!db.shifts) db.shifts = [];
  const shift = { id: Date.now().toString(), ...req.body, status: req.user.roleId === 'ADMIN' ? 'approved' : 'pending' };
  db.shifts.push(shift);
  saveDB(db);
  res.json(shift);
});

app.put('/api/shifts/:id', authMw, adminOnly, (req, res) => {
  const db = loadDB();
  if (!db.shifts) db.shifts = [];
  const idx = db.shifts.findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.shifts[idx] = { ...db.shifts[idx], ...req.body };
  saveDB(db);
  res.json(db.shifts[idx]);
});

app.delete('/api/shifts/:id', authMw, adminOnly, (req, res) => {
  const db = loadDB();
  if (!db.shifts) db.shifts = [];
  const idx = db.shifts.findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.shifts.splice(idx, 1);
  saveDB(db);
  res.json({ ok: true });
});

app.get('/api/payroll-settings', authMw, adminOnly, (req, res) => {
  const db = loadDB();
  res.json(db.payrollSettings || { latePenalty: 5000, standardDays: 26, otRate: 1.5 });
});

app.post('/api/payroll-settings', authMw, adminOnly, (req, res) => {
  const db = loadDB();
  db.payrollSettings = { ...db.payrollSettings, ...req.body };
  saveDB(db);
  res.json(db.payrollSettings);
});

app.get('/api/payroll', authMw, requirePermission('payroll.view'), (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) return res.status(400).json({ error: 'Thiếu tháng' });
  const db = loadDB();
  const settings = db.payrollSettings || { latePenalty: 5000, standardDays: 26, otRate: 1.5 };
  
  const attendance = (db.staffAttendance || []).filter(a => a.date.startsWith(month));
  const classes = (db.classes || []);
  const staff = (db.staff || []);
  
  // Giáo viên: Lương = Tổng giờ dạy * Đơn giá. Thống kê theo bộ môn.
  const teacherPayroll = [];
  // Staff: Lương = Lương cơ bản + OT - Đi muộn
  const staffPayroll = [];
  
  staff.forEach(s => {
    const sAtt = attendance.filter(a => String(a.staffId) === String(s.id));
    const totalLateMins = sAtt.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
    const latePenalty = totalLateMins * (settings.latePenalty || 0);
    const totalHours = sAtt.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const lateDays = sAtt.filter(a => (a.lateMinutes || 0) > 0).length;

    if (s.roleId === 'GIAO_VIEN' || (s.roles && s.roles.includes('teacher'))) {
      // Find classes taught by this teacher
      const myClasses = classes.filter(c => String(c.teacherId) === String(s.id));
      let totalTeachingHours = 0;
      let subjectBreakdown = {};
      
      // Calculate teaching hours based on attendance?
      // In a real system, teaching hours = classes that actually happened where teacher was present.
      // We assume if teacher checked in on a day they have a class, they taught it.
      // For simplicity, we just count hours from their classes if they checked in that day.
      const attendedDays = new Set(sAtt.map(a => a.date));
      myClasses.forEach(c => {
        // Find which days of the week this class happens
        const days = c.schedule ? c.schedule.map(x => x.day) : []; // e.g. [2,4]
        // Count how many attendedDays fall on these weekdays
        let count = 0;
        attendedDays.forEach(d => {
          const wd = new Date(d).getDay() || 7; // 1(Mon)-7(Sun)
          if (days.includes(wd + 1)) count++; // schedule.day uses 2 for Monday, 8 for Sunday
        });
        
        // Duration of class in hours
        let dur = 1; 
        if (c.schedule && c.schedule[0] && c.schedule[0].start && c.schedule[0].end) {
          const [sh, sm] = c.schedule[0].start.split(':').map(Number);
          const [eh, em] = c.schedule[0].end.split(':').map(Number);
          dur = ((eh*60+em) - (sh*60+sm)) / 60;
        }
        
        const hours = count * dur;
        totalTeachingHours += hours;
        subjectBreakdown[c.course] = (subjectBreakdown[c.course] || 0) + hours;
      });
      
      const rate = s.hourlyRate || 150000;
      const salary = totalTeachingHours * rate;
      
      teacherPayroll.push({
        staffId: s.id,
        name: s.name,
        role: s.role,
        totalTeachingHours,
        subjectBreakdown,
        rate,
        lateDays,
        totalLateMins,
        salary
      });
    } else {
      const baseSalary = s.baseSalary || 0;
      const otHours = Math.max(0, totalHours - (settings.standardDays * 8)); // Example OT
      const otSalary = otHours * ((baseSalary / (settings.standardDays * 8)) * settings.otRate);
      
      staffPayroll.push({
        staffId: s.id,
        name: s.name,
        role: s.role,
        baseSalary,
        totalHours,
        otHours,
        otSalary,
        lateDays,
        totalLateMins,
        latePenalty,
        salary: baseSalary + otSalary - latePenalty
      });
    }
  });

  res.json({ teacherPayroll, staffPayroll, settings });
});

app.get('/api/staff-attendance', authMw, (req,res) => {
  const db=loadDB();
  let records=db.staffAttendance||[];
  if(req.user.roleId === 'GIAO_VIEN') records=records.filter(a=>String(a.staffId)===String(req.user.linkedStaffId));
  if(req.query.month) records=records.filter(a=>a.date&&a.date.startsWith(req.query.month));
  res.json(records);
});


// CHỐT LƯƠNG (PAYROLL SNAPSHOTS)
app.post('/api/payroll/snapshot', authMw, (req, res) => {
  if (req.user.roleId !== 'ADMIN') return res.status(403).json({error: 'Chỉ Admin mới có quyền chốt lương'});
  const { month, data } = req.body;
  const db = loadDB();
  if (!db.payrollSnapshots) db.payrollSnapshots = [];
  
  db.payrollSnapshots = db.payrollSnapshots.filter(s => s.month !== month);
  db.payrollSnapshots.push({ month, createdAt: new Date().toISOString(), data });
  
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/payroll/snapshot', authMw, (req, res) => {
  const db = loadDB();
  const snapshots = db.payrollSnapshots || [];
  if (req.query.month) {
    const s = snapshots.find(x => x.month === req.query.month);
    return res.json(s ? s : null);
  }
  res.json(snapshots);
});

// DELETE staff attendance (admin only)
app.delete('/api/staff-attendance/:id', authMw, (req,res) => {
  if (req.user.roleId !== 'ADMIN' && req.user.roleId !== 'staff') {
    return res.status(403).json({error:'Không có quyền xóa'});
  }
  const db = loadDB();
  const id = req.params.id;
  const before = (db.staffAttendance||[]).length;
  db.staffAttendance = (db.staffAttendance||[]).filter(a => String(a.id) !== String(id));
  if (db.staffAttendance.length === before) return res.status(404).json({error:'Không tìm thấy bản ghi'});
  saveDB(db);
  audit(req.user.username,'DELETE_ATTENDANCE',`id=${id}`);
  res.json({ok:true});
});

// ── Calc end date ──
app.post('/api/calc-end-date', authMw, (req,res) => {
  const {startDate,totalSessions} = req.body||{};
  if(!startDate||!totalSessions) return res.status(400).json({error:'Thiếu thông tin'});
  const yr=new Date(startDate).getFullYear();
  const allH=new Set();
  for(let y=yr;y<=yr+2;y++){
    FIXED_HOLIDAYS.forEach(md=>allH.add(`${y}-${md}`));
    if(TET_HOLIDAYS[String(y)]) TET_HOLIDAYS[String(y)].forEach(d=>allH.add(d));
  }
  let date=new Date(startDate+'T00:00:00');
  let sessions=0,iter=0;
  while(sessions<totalSessions&&iter<1000){
    iter++;
    const dow=date.getDay();
    const ds=date.toISOString().slice(0,10);
    if(dow!==0&&!allH.has(ds)) sessions++;
    if(sessions<totalSessions) date.setDate(date.getDate()+1);
  }
  res.json({endDate:date.toISOString().slice(0,10)});
});

// ── VietQR ──
app.post('/api/vietqr', authMw, (req,res) => {
  const {amount,studentCode,note}=req.body||{};
  if(!amount) return res.status(400).json({error:'Thiếu số tiền'});
  const addInfo=note||`VS_${studentCode||'HV'}_HOCPHI`;
  const qrUrl=`https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.jpg?amount=${encodeURIComponent(amount)}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(BANK.name)}`;
  res.json({qrUrl,bank:BANK,amount,addInfo});
});

// ── Notifications ──
app.get('/api/notifications', authMw, staffUp, (req,res) => {
  const db=loadDB();
  res.json((db.notifications||[]).slice(0,50));
});
app.post('/api/notifications/read', authMw, staffUp, (req,res) => {
  const db=loadDB();
  (db.notifications||[]).forEach(n=>n.read=true);
  saveDB(db);
  res.json({ok:true});
});
app.post('/api/check-reminders', authMw, staffUp, (req,res) => {
  const db=loadDB();
  const today=new Date();
  const newN=[];
  (db.students||[]).forEach(s=>{
    if(!s.end) return;
    const _endDate = safeDate(s.end);
    if (!_endDate) return;
    const daysLeft=Math.ceil((_endDate-today)/(1000*60*60*24));
    if(daysLeft>=0&&daysLeft<=14){
      const already=(db.notifications||[]).find(n=>n.type==='TUITION'&&n.studentId===s.id&&n.createdDate===today.toISOString().slice(0,10));
      if(!already) newN.push({id:Date.now()+Math.random(),type:'TUITION',studentId:s.id,studentName:s.name,daysLeft,endDate:s.end,read:false,createdDate:today.toISOString().slice(0,10),createdAt:today.toISOString(),message:`${s.name} còn ${daysLeft} ngày kết thúc khóa (${s.subject}). Chưa đóng học phí.`});
    }
  });
  if(newN.length){if(!db.notifications)db.notifications=[];db.notifications=[...newN,...db.notifications].slice(0,500);saveDB(db);}
  res.json({newCount:newN.length});
});

// ── Audit ──
app.get('/api/audit', authMw, adminOnly, (req,res) => {
  try { res.json(JSON.parse(fs.readFileSync(AUDIT,'utf8')).slice(0,Number(req.query.limit)||200)); }
  catch { res.json([]); }
});

// ── Zalo ──
app.get('/api/zalo/config', authMw, adminOnly, (req,res) => { const db=loadDB(); res.json(db.zaloCfg||{}); });
app.post('/api/zalo/config', authMw, adminOnly, (req,res) => {
  const db=loadDB();
  const prev=db.zaloCfg||{};
  db.zaloCfg={...prev,...req.body,updatedAt:new Date().toISOString()};
  saveDB(db); audit(req.user.username,'ZALO_CONFIG','Cập nhật cấu hình Zalo');
  res.json({ok:true});
});

// Gửi ZNS và ghi lịch sử
app.post('/api/zalo/send', authMw, staffUp, async (req,res) => {
  const db=loadDB();
  const {phone,templateData,type='nhắc học phí',studentName=''}=req.body||{};
  const cfg=db.zaloCfg||{};
  if(!cfg.oaAccessToken) return res.status(400).json({error:'Chưa cấu hình Zalo OA token. Vào Hệ Thống → Zalo ZNS.'});
  if(!phone) return res.status(400).json({error:'Thiếu số điện thoại'});
  const templateId=type.includes('bù')?cfg.templateIdMakeup:cfg.templateId;
  if(!templateId) return res.status(400).json({error:'Chưa cấu hình Template ID cho loại tin này'});
  let ok=false,errMsg='';
  try {
    const resp=await fetch('https://business.openapi.zalo.me/message/template',{
      method:'POST',
      headers:{'Content-Type':'application/json','access_token':cfg.oaAccessToken},
      body:JSON.stringify({phone,template_id:templateId,template_data:templateData})
    });
    const data=await resp.json();
    if(data.error===0){ok=true;}else{errMsg=data.message||'Lỗi Zalo ZNS';}
  } catch(e){errMsg=e.message;}
  // Ghi lịch sử
  if(!db.zaloCfg.sendHistory) db.zaloCfg.sendHistory=[];
  db.zaloCfg.sendHistory.unshift({at:new Date().toISOString(),phone,studentName,type,ok,error:errMsg});
  if(db.zaloCfg.sendHistory.length>100) db.zaloCfg.sendHistory.splice(100);
  saveDB(db);
  audit(req.user.username,'ZALO_SEND',`${phone} ${type} ${ok?'OK':errMsg}`);
  if(!ok) return res.status(400).json({error:errMsg});
  res.json({ok:true});
});

// ── Export CSV ──
app.get('/api/export/:type', authMw, (req,res) => {
  const {type}=req.params;
  const db=loadDB();
  const BOM='\uFEFF';
  const fd = safeFd; // safe: returns '' for null/undefined/invalid dates
  const fn=n=>Number(n||0).toLocaleString('vi-VN');
  const q=v=>`"${String(v||'').replace(/"/g,'""')}"`;
  let csv=BOM,filename='';
  if(type==='students'){filename='HocVien.csv';csv+=['#','Họ Tên','Ngày Sinh','Phụ Huynh','SĐT','Môn Học','Gói Lớp','Ngày BD','Ngày KT','Hình Thức','Số Tiền','Ngày Nộp','Ghi Chú'].map(q).join(',')+'\n';(db.students||[]).forEach((s,i)=>{csv+=[i+1,s.name,fd(s.dob),s.parent,s.phone,s.subject,s.pkg||'',fd(s.start),fd(s.end),s.payment,fn(s.amount),fd(s.paydate),s.note||''].map(q).join(',')+'\n';});}
  else if(type==='revenue'){filename='DoanhThu.csv';csv+=['#','Họ Tên','Môn','Gói','Hình Thức','Số Tiền','Ngày Nộp'].map(q).join(',')+'\n';const paid=(db.students||[]).filter(s=>s.payment!=='Chưa Thanh Toán'&&s.amount);paid.forEach((s,i)=>{csv+=[i+1,s.name,s.subject,s.pkg||'',s.payment,fn(s.amount),fd(s.paydate)].map(q).join(',')+'\n';});const total=paid.reduce((a,s)=>a+Number(s.amount||0),0);csv+=`"","","","","TỔNG",${q(fn(total))},""\n`;}
  else if(type==='staff-attendance'){filename='ChamCong.csv';csv+=['Nhân Viên','Ngày','Vào','Ra','Phương Thức','Ghi Chú'].map(q).join(',')+'\n';(db.staffAttendance||[]).forEach(a=>{const st=(db.staff||[]).find(s=>String(s.id)===String(a.staffId));csv+=[st?st.name:a.staffId,fd(a.date),a.checkIn||'',a.checkOut||'',a.method||'',a.note||''].map(q).join(',')+'\n';});}
  else return res.status(404).json({error:'Loại không hợp lệ'});
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(csv);
});

// ── Backup / Restore ──
app.get('/api/backup', authMw, adminOnly, (req,res) => {
  const fn=`vinsoul_backup_${new Date().toISOString().slice(0,10)}.json`;
  res.setHeader('Content-Disposition',`attachment; filename="${fn}"`);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.send(JSON.stringify(loadDB(),null,2));
});
app.post('/api/restore', authMw, adminOnly, (req,res) => {
  try {
    if(typeof req.body!=='object'||Array.isArray(req.body)) return res.status(400).json({error:'Dữ liệu không hợp lệ'});
    saveDB({...EMPTY,...req.body});
    audit(req.user.username,'RESTORE','Khôi phục dữ liệu');
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});


// Staff bank QR code
app.get('/api/staff/:id/bank-qr', authMw, (req,res) => {
  const db=loadDB();
  const s=(db.staff||[]).find(x=>String(x.id)===req.params.id);
  if(!s||!s.bankAccount) return res.status(404).json({error:'Không có thông tin STK'});
  // Use VietQR for staff bank account
  const bankBin = s.bankBin || '970436'; // default Vietcombank
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${s.bankAccount}-compact2.jpg?accountName=${encodeURIComponent(s.name||'')}`;
  res.json({qrUrl, bankAccount:s.bankAccount, bankBin, name:s.name});
});


// ── Student media upload (base64 image/video thumbnail) ──
const MEDIA_DIR = path.join(path.resolve(process.cwd()), 'student_media');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

app.post('/api/student/:id/media', authMw, teacherUp, (req,res) => {
  const sid = req.params.id;
  const { dataUrl, filename, type, caption, date } = req.body || {};
  if (!dataUrl || !filename) return res.status(400).json({ error: 'Thiếu dữ liệu' });
  try {
    const studentDir = path.join(MEDIA_DIR, String(sid));
    if (!fs.existsSync(studentDir)) fs.mkdirSync(studentDir, { recursive: true });
    const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.writeFileSync(path.join(studentDir, safeName), Buffer.from(base64, 'base64'));
    const mediaUrl = `/student_media/${sid}/${safeName}`;
    // Save media record to student in DB
    const db = loadDB();
    const idx = (db.students||[]).findIndex(s => String(s.id) === String(sid));
    if (idx !== -1) {
      if (!db.students[idx].mediaFiles) db.students[idx].mediaFiles = [];
      db.students[idx].mediaFiles.push({
        id: Date.now(), url: mediaUrl, filename: safeName,
        type: type || 'image', caption: caption || '', date: date || new Date().toISOString().slice(0,10),
        uploadedBy: req.user.displayName, uploadedAt: new Date().toISOString()
      });
      saveDB(db);
    }
    audit(req.user.username, 'UPLOAD_MEDIA', `HV ${sid}: ${safeName}`);
    res.json({ ok: true, url: mediaUrl });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/student/:id/media/:filename', authMw, teacherUp, (req,res) => {
  const { id, filename } = req.params;
  try {
    const filePath = path.join(MEDIA_DIR, id, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const db = loadDB();
    const idx = (db.students||[]).findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      db.students[idx].mediaFiles = (db.students[idx].mediaFiles||[]).filter(m => m.filename !== filename);
      saveDB(db);
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.use('/student_media', express.static(MEDIA_DIR));
app.use('/attendance_photos', express.static(PHOTO_DIR));


// ── Real Excel export using xlsx library ──
// Note: XLSX is imported at the top of the file

app.get('/api/export-xlsx/:type', authMw, (req,res) => {
  const db = loadDB();
  const { type } = req.params;
  const fd = safeFd; // safe: returns '' for null/undefined/invalid dates
  const fn = n => Number(n||0);
  let wb, ws, filename;

  if (type === 'students') {
    filename = 'HocVien.xlsx';
    const rows = [['#','Họ Tên','Ngày Sinh','Phụ Huynh','SĐT','Môn Học','Gói Lớp','Ngày BD','Ngày KT','Hình Thức','Số Tiền','Ngày Nộp','Ghi Chú','Số Buổi Còn Lại']];
    const extractTotalSessions = (pkg) => { const m = String(pkg||'').match(/(\d+)\s*buổi/); return m ? parseInt(m[1]) : 0; };
    const countStudentSessions = (sid) => {
      let count = 0;
      (db.attendance||[]).forEach(a => { if (a.records && a.records[String(sid)] === 'present') count++; });
      (db.makeups||[]).forEach(m => { if (String(m.studentId) === String(sid) && m.status === 'done') count++; });
      return count;
    };
    (db.students||[]).forEach((s,i) => {
      const totalPkg = s.totalSessions ? Number(s.totalSessions) : extractTotalSessions(s.pkg);
      const doneSessions = countStudentSessions(s.id);
      const remain = Math.max(0, totalPkg - doneSessions);
      rows.push([i+1,s.name,fd(s.dob),s.parent||'',s.phone||'',s.subject||'',s.pkg||'',fd(s.start),fd(s.end),s.payment||'',fn(s.amount),fd(s.paydate),s.note||'', remain]);
    });
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else if (type === 'revenue') {
    filename = 'DoanhThu.xlsx';
    const paid = (db.students||[]).filter(s => s.payment !== 'Chưa Thanh Toán' && s.amount);
    const rows = [['#','Họ Tên','Môn Học','Gói Lớp','Hình Thức','Số Tiền','Ngày Nộp']];
    paid.forEach((s,i) => rows.push([i+1,s.name,s.subject||'',s.pkg||'',s.payment||'',fn(s.amount),fd(s.paydate)]));
    const total = paid.reduce((a,s)=>a+Number(s.amount||0),0);
    rows.push(['','','','','TỔNG',total,'']);
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else if (type === 'payroll') {
    filename = 'BangLuong.xlsx';
    const month = req.query.month || new Date().toISOString().slice(0,7);
    const rows = [['#','Họ Tên','Chức Vụ','Ngày Công','Buổi Dạy','Lương CB','Trừ Muộn','Trừ Lỗi','STK','Ghi Chú','Thực Lĩnh']];
    (db.staff||[]).forEach((s,i) => {
      const att = (db.staffAttendance||[]).filter(a => String(a.staffId)===String(s.id) && a.date && a.date.startsWith(month));
      let lateMin=0;
      att.forEach(a => { if(a.checkIn){const[h,m]=a.checkIn.split(':').map(Number);const d=(h*60+m)-480;if(d>15)lateMin+=d-15;}});
      const base=Number(s.salary||0), lateD=lateMin*1000, custD=Number(s.customDeduct||0);
      const final=Math.max(0,base-lateD-custD);
      rows.push([i+1,s.name,s.role||'',att.length,0,base,lateD,custD,s.bankAccount||'',s.payrollNote||'',final]);
    });
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else if (type === 'attendance') {
    filename = 'DiemDanh.xlsx';
    const rows = [['Ngày','Lớp','Học Viên','Trạng Thái']];
    (db.attendance||[]).forEach(a => {
      const cls = (db.classes||[]).find(c=>String(c.id)===String(a.classId));
      Object.entries(a.records||{}).forEach(([sid,status]) => {
        const st = (db.students||[]).find(s=>String(s.id)===String(sid) || (s.vsId && String(s.vsId).toUpperCase()===String(sid).toUpperCase()));
        rows.push([fd(a.date),cls?cls.name:'?',st?st.name:sid,status]);
      });
    });
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else if (type === 'payment-history') {
    filename = 'LichSuThanhToan.xlsx';
    const rows = [['#','Học Viên','Môn','Số Tiền','Hình Thức','Ngày Nộp','Ghi Chú']];
    (db.paymentHistory||[]).forEach((p,i) => rows.push([i+1,p.studentName||'',p.subject||'',fn(p.amount),p.method||'',fd(p.date),p.note||'']));
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else {
    return res.status(404).json({error:'Loại không hợp lệ'});
  }

  // Style: auto column width
  const range = XLSX.utils.decode_range(ws['!ref']||'A1');
  const colWidths = [];
  for (let C=range.s.c; C<=range.e.c; C++) {
    let max = 10;
    for (let R=range.s.r; R<=range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({r:R,c:C})];
      if (cell && cell.v) max = Math.max(max, String(cell.v).length);
    }
    colWidths.push({wch: Math.min(max+2, 40)});
  }
  ws['!cols'] = colWidths;

  wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buf = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(buf);
});

// ── Payment History ──
app.post('/api/payment-history', authMw, (req,res) => {
  const db = loadDB();
  const { studentId, studentName, subject, amount, method, date, note } = req.body||{};
  if (!studentId || !amount) return res.status(400).json({error:'Thiếu thông tin'});
  if (!db.paymentHistory) db.paymentHistory = [];
  const entry = { id:Date.now(), studentId, studentName, subject, amount:Number(amount), method:method||'', date:date||new Date().toISOString().slice(0,10), note:note||'', recordedBy:req.user.displayName, createdAt:new Date().toISOString() };
  db.paymentHistory.push(entry);
  saveDB(db);
  audit(req.user.username,'PAYMENT',`${studentName} ${amount}`);
  res.json({ok:true,entry});
});

app.get('/api/payment-history/:studentId', authMw, (req,res) => {
  const db = loadDB();
  const history = (db.paymentHistory||[]).filter(p=>String(p.studentId)===String(req.params.studentId));
  res.json(history);
});

// ── Revenue Forecast ──
app.get('/api/forecast', authMw, (req,res) => {
  const db = loadDB();
  const now = new Date();
  const forecast = [];
  // Next 3 months: students expiring = potential renewal revenue
  for (let i=1; i<=3; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const targetEnd  = new Date(now.getFullYear(), now.getMonth()+i+1, 0);
    const expiring = (db.students||[]).filter(s => {
      if (!s.end) return false;
      const d = new Date(s.end);
      return d >= targetDate && d <= targetEnd;
    });
    const potentialRevenue = expiring.reduce((a,s)=>a+Number(s.amount||0),0);
    const m = targetDate.getMonth()+1;
    forecast.push({ month: `T${m}/${targetDate.getFullYear()}`, count: expiring.length, potential: potentialRevenue, students: expiring.map(s=>({id:s.id,name:s.name,subject:s.subject,amount:s.amount,end:s.end})) });
  }
  res.json(forecast);
});

// ── Holidays CRUD ──
app.get('/api/holidays', authMw, (req,res) => {
  const db = loadDB();
  // Return custom holidays + known Vietnamese fixed holidays
  const year = req.query.year || new Date().getFullYear();
  const fixed = FIXED_HOLIDAYS.map(md => ({ date: `${year}-${md}`, type: 'fixed', name: md==='01-01'?'Tết Dương Lịch':md==='04-30'?'Giải Phóng 30/4':md==='05-01'?'Quốc Tế Lao Động':'Quốc Khánh 2/9' }));
  const tet = (TET_HOLIDAYS[String(year)]||[]).map(d => ({ date: d, type: 'tet', name: 'Tết Nguyên Đán' }));
  const custom = (db.holidays||[]).filter(h => h.date && h.date.startsWith(String(year)));
  res.json([...fixed, ...tet, ...custom]);
});

app.post('/api/holidays', authMw, staffUp, (req,res) => {
  const db = loadDB();
  if (!db.holidays) db.holidays = [];
  const { date, name, note, endDate } = req.body||{};
  if (!date || !name) return res.status(400).json({error:'Thiếu thông tin'});
  // If range, add each day
  const entries = [];
  const start = new Date(date);
  const end = endDate ? new Date(endDate) : start;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const ds = d.toISOString().slice(0,10);
    if (!db.holidays.find(h => h.date === ds && h.name === name)) {
      const entry = { id: Date.now()+Math.random(), date: ds, name, note: note||'', type: 'custom', addedBy: req.user.displayName, createdAt: new Date().toISOString() };
      db.holidays.push(entry);
      entries.push(entry);
    }
  }
  saveDB(db);
  audit(req.user.username, 'ADD_HOLIDAY', `${date} - ${name}`);
  res.json({ok:true, count: entries.length});
});

app.delete('/api/holidays/:id', authMw, staffUp, (req,res) => {
  const db = loadDB();
  db.holidays = (db.holidays||[]).filter(h => String(h.id) !== String(req.params.id));
  saveDB(db);
  res.json({ok:true});
});

// ── Care Log ──
app.post('/api/student/:id/care-log', authMw, staffUp, (req,res) => {
  const db = loadDB();
  const idx = (db.students||[]).findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({error:'Không tìm thấy học viên'});
  if (!db.students[idx].careLog) db.students[idx].careLog = [];
  const { type, result, note } = req.body||{};
  const entry = { id: Date.now(), type: type||'Zalo', result: result||'', note: note||'', by: req.user.displayName, at: new Date().toISOString() };
  db.students[idx].careLog.unshift(entry);
  saveDB(db);
  audit(req.user.username, 'CARE_LOG', `HV ${req.params.id}: ${type}`);
  res.json({ok:true, entry});
});

// ── Notification badge count ──
app.get('/api/notifications/count', authMw, staffUp, (req,res) => {
  const db = loadDB();
  const unread = (db.notifications||[]).filter(n => !n.read).length;
  // Also count unpaid students
  const unpaid = (db.students||[]).filter(s => s.payment === 'Chưa Thanh Toán').length;
  const expiring = (db.students||[]).filter(s => {
    if (!s.end || s.subject === 'Học Thử') return false;
    const _ed = safeDate(s.end);
    if (!_ed) return false;
    const d = Math.ceil((_ed - new Date()) / (1000*60*60*24));
    return d >= 0 && d <= 7;
  }).length;
  res.json({ unread, unpaid, expiring, total: unread + Math.min(unpaid + expiring, 20) });
});

// ── Bulk import students ──
app.post('/api/import-students', authMw, staffUp, (req,res) => {
  const db = loadDB();
  const { rows } = req.body||{};
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({error:'Không có dữ liệu'});
  let added = 0, skipped = 0;
  const maxId = (db.students||[]).reduce((m,s) => Math.max(m, Number(s.vsId?.replace('HV','')||0)), 0);
  let nextId = maxId + 1;
  rows.forEach(row => {
    if (!row.name || !row.phone) { skipped++; return; }
    const dup = (db.students||[]).find(s => s.phone === row.phone && s.name === row.name);
    if (dup) { skipped++; return; }
    db.students.push({
      id: Date.now() + Math.random(),
      vsId: `HV${String(nextId++).padStart(4,'0')}`,
      name: row.name||'', parent: row.parent||'', phone: row.phone||'',
      subject: row.subject||'', pkg: row.pkg||'',
      start: row.start||'', end: row.end||'',
      payment: row.payment||'Chưa Thanh Toán',
      amount: Number(row.amount)||0,
      paydate: row.paydate||'', note: row.note||'',
      importedAt: new Date().toISOString()
    });
    added++;
  });
  saveDB(db);
  audit(req.user.username, 'IMPORT_STUDENTS', `Thêm ${added}, bỏ qua ${skipped}`);
  res.json({ok:true, added, skipped});
});

// ── Teacher schedule ──
app.get('/api/teacher-schedule/:staffId', authMw, (req,res) => {
  const db = loadDB();
  const staffMember = (db.staff||[]).find(s=>String(s.id)===String(req.params.staffId));
  if (!staffMember) return res.status(404).json({error:'Không tìm thấy'});
  const myClasses = (db.classes||[]).filter(c => c.teacher && c.teacher.includes(staffMember.name));
  const today = new Date();
  const dayMap = ['Chủ Nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  const todayName = dayMap[today.getDay()];
  const todaySlots = [];
  myClasses.forEach(cls => {
    (cls.schedule||[]).forEach(slot => {
      if (slot.day === todayName) {
        const studentCount = (db.students||[]).filter(s=>String(s.classid)===String(cls.id)).length;
        todaySlots.push({ classId:cls.id, className:cls.name, subject:cls.subject, start:slot.start, end:slot.end||'', room:cls.room||'', studentCount });
      }
    });
  });
  todaySlots.sort((a,b)=>a.start>b.start?1:-1);
  res.json({ staffId:req.params.staffId, name:staffMember.name, today:todayName, todaySlots, allClasses:myClasses });
});

// ══════════════════════════════════════
// NEWS / BẢNG TIN
// ══════════════════════════════════════
// NEWS_MEDIA_DIR moved to top
app.use('/news_media', express.static(NEWS_MEDIA_DIR));

// GET all news (everyone can view)
app.get('/api/news', authMw, (req,res) => {
  const db = loadDB();
  const news = (db.news || []).sort((a,b) => b.createdAt < a.createdAt ? -1 : 1);
  res.json(news);
});

// GET single news
app.get('/api/news/:id', authMw, (req,res) => {
  const db = loadDB();
  const item = (db.news || []).find(n => String(n.id) === String(req.params.id));
  if (!item) return res.status(404).json({error:'Không tìm thấy'});
  res.json(item);
});

// POST create news (admin only)
app.post('/api/news', authMw, adminOnly, (req,res) => {
  const db = loadDB();
  if (!db.news) db.news = [];
  const { title, content, category, images, videoUrl } = req.body;
  if (!title || !content) return res.status(400).json({error:'Thiếu tiêu đề hoặc nội dung'});
  
  // Save base64 images to files
  const savedImages = [];
  if (images && Array.isArray(images)) {
    images.forEach((img, i) => {
      if (img.startsWith('data:image')) {
        const ext = img.includes('png') ? 'png' : 'jpg';
        const fname = `news_${Date.now()}_${i}.${ext}`;
        const base64 = img.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(path.join(NEWS_MEDIA_DIR, fname), Buffer.from(base64, 'base64'));
        savedImages.push(`/news_media/${fname}`);
      } else {
        savedImages.push(img);
      }
    });
  }
  
  const item = {
    id: Date.now(),
    title,
    content,
    category: category || 'Thông báo',
    images: savedImages,
    videoUrl: videoUrl || '',
    author: req.user.displayName || req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false
  };
  db.news.unshift(item);
  saveDB(db);
  audit(req.user.username, 'CREATE_NEWS', title);
  res.json(item);
});

// POST like/unlike news
app.post('/api/news/:id/like', authMw, (req,res) => {
  if (req.user.roleId === 'GIAO_VIEN') return res.status(403).json({error:'Giáo viên không có quyền này'});
  const db = loadDB();
  if (!db.news) db.news = [];
  const idx = db.news.findIndex(n => String(n.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({error:'Không tìm thấy bài viết'});

  if (!db.news[idx].likes) db.news[idx].likes = [];
  const uid = req.user.id;
  const likeIdx = db.news[idx].likes.indexOf(uid);
  if (likeIdx > -1) {
    db.news[idx].likes.splice(likeIdx, 1);
  } else {
    db.news[idx].likes.push(uid);
  }

  saveDB(db);
  res.json({ likes: db.news[idx].likes });
});

// POST create news comment (any logged in user)
app.post('/api/news/:id/comments', authMw, (req,res) => {
  const db = loadDB();
  if (!db.news) db.news = [];
  const idx = db.news.findIndex(n => String(n.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({error:'Không tìm thấy bài viết'});

  const { content } = req.body;
  if (!content) return res.status(400).json({error:'Nội dung bình luận trống'});

  const users = loadUsers();
  const u = users.find(x => x.id === req.user.id) || req.user;

  if (!db.news[idx].comments) db.news[idx].comments = [];
  
  const comment = {
    id: Date.now().toString(),
    userId: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    avatar: u.avatar || null,
    content: content,
    createdAt: new Date().toISOString()
  };

  db.news[idx].comments.push(comment);
  saveDB(db);
  
  res.json(comment);
});

// PUT update news (admin only)
app.put('/api/news/:id', authMw, adminOnly, (req,res) => {
  const db = loadDB();
  if (!db.news) db.news = [];
  const idx = db.news.findIndex(n => String(n.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({error:'Không tìm thấy'});
  const { title, content, category, images, videoUrl, pinned } = req.body;
  
  // Save new base64 images
  const savedImages = [];
  if (images && Array.isArray(images)) {
    images.forEach((img, i) => {
      if (img.startsWith('data:image')) {
        const ext = img.includes('png') ? 'png' : 'jpg';
        const fname = `news_${Date.now()}_${i}.${ext}`;
        const base64 = img.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(path.join(NEWS_MEDIA_DIR, fname), Buffer.from(base64, 'base64'));
        savedImages.push(`/news_media/${fname}`);
      } else {
        savedImages.push(img);
      }
    });
  }
  
  if (title) db.news[idx].title = title;
  if (content) db.news[idx].content = content;
  if (category) db.news[idx].category = category;
  if (images !== undefined) db.news[idx].images = savedImages;
  if (videoUrl !== undefined) db.news[idx].videoUrl = videoUrl;
  if (typeof pinned === 'boolean') db.news[idx].pinned = pinned;
  db.news[idx].updatedAt = new Date().toISOString();
  saveDB(db);
  audit(req.user.username, 'UPDATE_NEWS', db.news[idx].title);
  res.json(db.news[idx]);
});

// DELETE news (admin only)
app.delete('/api/news/:id', authMw, adminOnly, (req,res) => {
  const db = loadDB();
  if (!db.news) db.news = [];
  const idx = db.news.findIndex(n => String(n.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({error:'Không tìm thấy'});
  const title = db.news[idx].title;
  db.news.splice(idx, 1);
  saveDB(db);
  audit(req.user.username, 'DELETE_NEWS', title);
  res.json({ok:true});
});

// ══════════════════════════════════════
// TEACHER RATING
// ══════════════════════════════════════

// GET teacher ratings (admin can see all, teacher can see their own)
app.get('/api/teacher-rating', authMw, (req,res) => {
  const db = loadDB();
  let ratings = db.teacherRatings || [];
  if (req.user.roleId === 'GIAO_VIEN') {
    ratings = ratings.filter(r => r.teacherName === req.user.displayName || r.teacherName === req.user.username);
  }
  res.json(ratings);
});

// POST teacher rating (student)
app.post('/api/teacher-rating', authMw, (req,res) => {
  const db = loadDB();
  if (!db.teacherRatings) db.teacherRatings = [];
  const { studentId, teacherName, rating, comment } = req.body;
  if (!studentId || !teacherName || !rating) return res.status(400).json({error:'Thiếu thông tin'});
  
  const item = {
    id: Date.now(),
    studentId,
    studentName: req.user.displayName,
    teacherName,
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };
  db.teacherRatings.unshift(item);
  
  // Send notification to teacher
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: Date.now(),
    targetRole: 'teacher',
    targetUser: teacherName,
    message: `Học viên ${req.user.displayName} đã đánh giá bạn ${rating} sao!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  audit(req.user.username, 'CREATE_RATING', `Rating cho ${teacherName}: ${rating} sao`);
  res.json(item);
});

// ─── Static files ───
app.use(express.static(APP_DIR, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('/',(req,res)=>{
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(APP_DIR,'index.html'));
});

app.use((req,res)=>{
  const p=path.join(APP_DIR,'index.html');
  if (fs.existsSync(p)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(p);
  } else {
    res.status(404).send('Không tìm thấy trang');
  }
});
app.use((err,req,res,next)=>{
  console.error('[LỖI]',err.message);
  if(req.path.startsWith('/api/')) return res.status(500).json({error:err.message});
  res.status(500).send('Lỗi server: '+err.message);
});

// Daily Auto Backup (Run every 12 hours)
setInterval(() => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const fn = `auto_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const dest = path.join(backupDir, fn);
    if (!fs.existsSync(dest) && fs.existsSync(DB)) {
      fs.copyFileSync(DB, dest);
      console.log(`[BACKUP] Tự động sao lưu database: ${fn}`);
    }
  } catch (e) {
    console.error('[BACKUP LỖI]', e.message);
  }
}, 1000 * 60 * 60 * 12); // Check every 12 hours

app.listen(PORT, '0.0.0.0', ()=>{
  loadUsers();
  console.log(`Vinsoul Academy v3.0 đang chạy tại: http://localhost:${PORT}`);
});
process.on('uncaughtException',err=>console.error('[LỖI NGHIÊM TRỌNG]',err.message));
process.on('unhandledRejection',r=>console.error('[LỖI PROMISE]',r));




// ----------------------------------------------------
// ACCOUNTS MANAGEMENT API (v3.0)
// ----------------------------------------------------

app.post('/api/users/:id/approve', authMw, (req, res) => {
    if (req.user.roleId !== 'ADMIN') return res.status(403).json({ error: 'Chỉ Admin mới có quyền duyệt' });
    const users = loadUsers();
    const user = users.find(u => String(u.id) === req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    user.status = 'APPROVED';
    user.roleId = req.body.roleId || 'GIAO_VIEN';
    saveUsers(users);
    audit(req.user.username, 'APPROVE_USER', 'Duyệt tài khoản ' + user.email);
    res.json({ ok: true, user });
});

app.post('/api/users/:id/role', authMw, (req, res) => {
    if (req.user.roleId !== 'ADMIN') return res.status(403).json({ error: 'Chỉ Admin mới có quyền' });
    const users = loadUsers();
    const user = users.find(u => String(u.id) === req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    user.roleId = req.body.roleId;
    saveUsers(users);
    audit(req.user.username, 'CHANGE_ROLE', 'Đổi quyền tài khoản ' + user.email + ' thành ' + user.roleId);
    res.json({ ok: true, user });
});

app.post('/api/users/:id/status', authMw, (req, res) => {
    if (req.user.roleId !== 'ADMIN') return res.status(403).json({ error: 'Chỉ Admin mới có quyền' });
    const users = loadUsers();
    const user = users.find(u => String(u.id) === req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    user.status = req.body.status;
    saveUsers(users);
    audit(req.user.username, 'CHANGE_STATUS', 'Đổi trạng thái ' + user.email + ' thành ' + user.status);
    res.json({ ok: true, user });
});





module.exports = app;
