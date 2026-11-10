// Tạo / đặt lại tài khoản đăng nhập bằng mật khẩu (không qua Google).
//   DATABASE_URL=... node scripts/set-login.mjs <username> <ROLE> "<Tên hiển thị>" <file-ghi-mật-khẩu>
// Mật khẩu ngẫu nhiên được ghi vào file (ngoài repo) — không in ra màn hình, không commit.
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const scrypt = promisify(scryptCb);
const ROLES = ['VJ_HOST', 'CSKH', 'BIEN_TAP', 'KY_THUAT', 'SAN_XUAT', 'LIVE_MANAGER', 'THU_KHO', 'MANAGER', 'ADMIN'];

const [username, role, name, outFile] = process.argv.slice(2);
if (!username || !ROLES.includes(role) || !outFile) {
  console.error('Cách dùng: node scripts/set-login.mjs <username> <ROLE> "<Tên>" <file-ghi-mật-khẩu>\nROLE: ' + ROLES.join(', '));
  process.exit(1);
}

const login = username.trim().toLowerCase();
const password = randomBytes(9).toString('base64url'); // 12 ký tự
const salt = randomBytes(16);
const passwordHash = `scrypt$${salt.toString('hex')}$${(await scrypt(password, salt, 64)).toString('hex')}`;

const prisma = new PrismaClient();
const user = await prisma.user.upsert({
  where: { username: login },
  update: { passwordHash, role, status: 'ACTIVE', ...(name ? { name } : {}) },
  create: { username: login, passwordHash, role, status: 'ACTIVE', name: name || login },
});
await prisma.$disconnect();

await writeFile(outFile, `CRM Livestream — tài khoản đăng nhập\nTrang: https://crm-livestream-fptu.vercel.app/login (mục "hoặc tài khoản")\nTài khoản: ${login}\nMật khẩu: ${password}\nVai trò: ${role}\n`, 'utf8');
console.log(`Đã đặt tài khoản ${login} (${role}, id ${user.id}). Mật khẩu ghi tại: ${outFile}`);
