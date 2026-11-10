// Đóng gói thư mục extension/ (gốc repo) thành public/fptu-extension.zip để người dùng tải từ CRM (trang Kết nối LIVE).
// Chạy tự động trước `npm run build`. Không thấy thư mục extension thì bỏ qua (build vẫn chạy).
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../../../../../extension');
const out = join(here, '../public/fptu-extension.zip');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (!entry.name.endsWith('.md')) files.push(p);
  }
  return files;
}

try {
  await stat(join(src, 'manifest.json'));
} catch {
  console.warn(`[pack-extension] Không thấy ${src}/manifest.json — bỏ qua, nút "Tải extension" sẽ lỗi 404`);
  process.exit(0);
}

const zip = new JSZip();
const root = zip.folder('fptu-extension');
for (const file of await walk(src)) root.file(relative(src, file).split(sep).join('/'), await readFile(file));
await writeFile(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
const { version } = JSON.parse(await readFile(join(src, 'manifest.json'), 'utf8'));
console.log(`[pack-extension] public/fptu-extension.zip (v${version})`);
