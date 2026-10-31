// Đọc file mã vận đơn Hành chính gửi lại (CSV hoặc dán từ Excel) → [{ id, carrier, trackingCode, trackingLink }].
// Cột nhận theo tiêu đề (không phân biệt dấu/hoa thường); không đọc được tiêu đề thì theo thứ tự file mẫu.

export type TrackingRow = { id: string; carrier: string; trackingCode: string; trackingLink: string };

// Thứ tự cột file "Gửi Hành chính" do trang Kho xuất
export const ADMIN_FILE_HEADER = ['Mã Đơn', 'Người nhận', 'SĐT', 'Địa chỉ', 'Quà tặng', 'Đơn vị vận chuyển', 'Mã vận đơn', 'Link tra cứu'];
const TEMPLATE_INDEX = { id: 0, carrier: 5, trackingCode: 6, trackingLink: 7 };

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t').map((c) => c.trim());
  const cells: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { cells.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function detectColumns(header: string[]) {
  const find = (test: (h: string) => boolean) => header.findIndex((h) => test(normalize(h)));
  const id = find((h) => h.includes('ma don') || h === 'order id' || h === 'id');
  const trackingCode = find((h) => h.includes('ma van don') || h.includes('ma vd') || h.includes('tracking'));
  const carrier = find((h) => h.includes('don vi van chuyen') || h.includes('dvvc') || h.includes('nha van chuyen') || h.includes('carrier'));
  const trackingLink = find((h) => h.includes('link'));
  return id >= 0 && trackingCode >= 0 ? { id, carrier, trackingCode, trackingLink } : null;
}

export function parseTrackingFile(text: string): { rows: TrackingRow[]; error?: string } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], error: 'File cần có dòng tiêu đề và ít nhất 1 dòng đơn hàng' };

  const first = lines[0];
  const delimiter = first.includes('\t') ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
  const header = splitLine(first, delimiter);
  const cols = detectColumns(header) ?? (header.length >= 7 ? TEMPLATE_INDEX : null);
  if (!cols) return { rows: [], error: 'Không thấy cột "Mã Đơn" và "Mã vận đơn" trong dòng tiêu đề' };

  const cell = (cells: string[], i: number) => (i >= 0 ? cells[i] ?? '' : '');
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    return {
      id: cell(cells, cols.id),
      carrier: cell(cells, cols.carrier),
      trackingCode: cell(cells, cols.trackingCode),
      trackingLink: cell(cells, cols.trackingLink),
    };
  }).filter((r) => r.id || r.trackingCode);
  return { rows };
}

export function toCsv(rows: unknown[][]): string {
  return '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}
