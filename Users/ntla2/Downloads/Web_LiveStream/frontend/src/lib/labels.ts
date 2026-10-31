// Tem giao hàng để in và dán lên gói quà. Hàm thuần (dễ kiểm tra) → HTML hoàn chỉnh cho cửa sổ in.

export type LabelLayout = 'A4_6' | 'THERMAL_100x150';

export const LABEL_LAYOUTS: Record<LabelLayout, { name: string; hint: string }> = {
  A4_6: { name: 'Giấy A4 — 6 tem/trang', hint: 'Máy in văn phòng, cắt theo viền đứt rồi dán' },
  THERMAL_100x150: { name: 'Khổ 100×150 mm — 1 tem/tờ', hint: 'Máy in nhiệt / giấy decal vận đơn' },
};

const DEFAULT_SENDER = 'Uống Gì Chưa — FPT University HCM';
const DEFAULT_SENDER_ADDRESS = 'Lô E2a-7, Đường D1, Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

export const trackingLink = (origin: string, id: string) => `${origin}/tracking?code=${encodeURIComponent(id)}`;

// "0912345678" → "0912 345 678" cho dễ đọc khi giao
export const formatPhone = (p?: string) => {
  const d = String(p ?? '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : String(p ?? '');
};

function labelHtml(o: any, origin: string) {
  const recipient = o.recipientName || o.recipient || '';
  const address = String(o.address ?? '');
  // Tên/địa chỉ dài → chữ nhỏ lại để không tràn xuống ô mã vận đơn
  const nameSize = recipient.length > 30 ? 'xs' : recipient.length > 20 ? 'sm' : '';
  const addrSize = address.length > 110 ? 'xs' : address.length > 70 ? 'sm' : '';
  const trackHost = trackingLink(origin, o.id).replace(/^https?:\/\//, '').replace(/\?.*$/, '');
  return `
  <section class="label">
    <div class="from">
      <span class="tag">TỪ</span>
      <div><b>${esc(o.senderName || DEFAULT_SENDER)}</b><br>${esc(o.senderAddress || DEFAULT_SENDER_ADDRESS)}</div>
    </div>
    <div class="to">
      <span class="tag tag-to">GỬI ĐẾN</span>
      <div class="name ${nameSize}">${esc(recipient)}</div>
      <div class="phone">${esc(formatPhone(o.phone))}</div>
      <div class="addr ${addrSize}">${esc(address)}</div>
    </div>
    <div class="foot">
      <div class="code-box">
        <div class="code-label">MÃ VẬN ĐƠN</div>
        <div class="code">${esc(o.id)}</div>
      </div>
      <div class="meta">
        ${o.gift ? `<div class="gift">🎁 ${esc(o.gift)}</div>` : ''}
        ${o.tiktokAccount ? `<div>TikTok: @${esc(o.tiktokAccount)}</div>` : ''}
        <div class="track">Tra cứu mã tại: ${esc(trackHost)}</div>
      </div>
    </div>
  </section>`;
}

const BASE_CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: Arial, 'Segoe UI', Roboto, sans-serif; color: #111; }
  .label { border: 1.6px dashed #444; border-radius: 3mm; padding: 3.5mm 4mm; display: flex; flex-direction: column; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
  .tag { display: inline-block; font-size: 7.5pt; font-weight: 800; letter-spacing: .6px; color: #fff; background: #555; border-radius: 1mm; padding: .4mm 1.6mm; margin-right: 2mm; flex-shrink: 0; }
  .tag-to { background: #005691; margin-bottom: 1.2mm; }
  .from { display: flex; align-items: flex-start; font-size: 7.5pt; line-height: 1.3; color: #444; padding-bottom: 2mm; border-bottom: 1px solid #ccc; }
  .to { flex: 1; padding: 2mm 0; min-height: 0; overflow: hidden; }
  .name { font-size: 15pt; font-weight: 800; line-height: 1.15; text-transform: uppercase; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .name.sm { font-size: 12.5pt; }
  .name.xs { font-size: 11pt; }
  .phone { font-size: 14pt; font-weight: 800; letter-spacing: .5px; margin: .8mm 0 1mm; }
  .addr { font-size: 11pt; line-height: 1.3; }
  .addr.sm { font-size: 10.5pt; }
  .addr.xs { font-size: 9.5pt; }
  .foot { display: flex; gap: 3mm; align-items: center; border-top: 1.4px solid #111; padding-top: 2mm; flex-shrink: 0; }
  .code-box { border: 2px solid #111; border-radius: 1.5mm; padding: 1mm 2.5mm; text-align: center; flex-shrink: 0; }
  .code-label { font-size: 6.5pt; font-weight: 800; letter-spacing: .8px; color: #555; }
  .code { font-family: 'Courier New', monospace; font-size: 15pt; font-weight: 900; letter-spacing: .5px; }
  .meta { font-size: 8pt; line-height: 1.35; color: #333; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .gift { font-size: 10pt; font-weight: 800; color: #b45309; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .track { color: #666; word-break: break-all; }
  @media screen { body { background: #e5e7eb; padding: 6mm; } .sheet { background: #fff; margin: 0 auto 6mm; box-shadow: 0 1px 6px rgba(0,0,0,.2); } }
`;

const LAYOUT_CSS: Record<LabelLayout, string> = {
  // A4 210×297, lề 8mm → vùng in 194×281: 2 cột × 3 hàng tem ~95×91mm (đủ chỗ cho địa chỉ dài, không cắt chữ)
  A4_6: `
    @page { size: A4; margin: 8mm; }
    .sheet { width: 194mm; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 91mm; gap: 4mm 4mm; }
    .label { padding: 4mm 4.5mm; }
    .name { font-size: 17pt; }
    .name.sm { font-size: 14pt; }
    .name.xs { font-size: 12.5pt; }
    .phone { font-size: 16pt; }
    @media screen { .sheet { width: 210mm; padding: 8mm; } }
  `,
  THERMAL_100x150: `
    @page { size: 100mm 150mm; margin: 0; }
    .sheet { width: 100mm; }
    .label { width: 100mm; height: 150mm; border: none; border-radius: 0; padding: 6mm; page-break-after: always; break-after: page; }
    .from { font-size: 9pt; }
    .name { font-size: 20pt; -webkit-line-clamp: 3; }
    .name.sm { font-size: 17pt; }
    .name.xs { font-size: 15pt; }
    .phone { font-size: 19pt; }
    .addr, .addr.sm { font-size: 13pt; }
    .addr.xs { font-size: 12pt; }
    .foot { flex-direction: column; align-items: stretch; gap: 2mm; }
    .code { font-size: 22pt; }
    .meta { font-size: 10pt; }
    .gift { font-size: 13pt; }
    @media screen { .label { border: 1px solid #ccc; margin-bottom: 4mm; background: #fff; } .sheet { background: transparent; box-shadow: none; } }
  `,
};

export function buildLabelsHtml(orders: any[], layout: LabelLayout, origin: string, autoPrint = true) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Tem giao hàng (${orders.length})</title>
<style>${BASE_CSS}${LAYOUT_CSS[layout]}</style></head>
<body><main class="sheet">${orders.map((o) => labelHtml(o, origin)).join('')}</main>
${autoPrint ? `<script>window.onload = function () { window.focus(); window.print(); };</scr` + `ipt>` : ''}
</body></html>`;
}

/** Mở cửa sổ in. Trả về thông báo lỗi (null = OK). */
export function printLabels(orders: any[], layout: LabelLayout): string | null {
  if (!orders.length) return 'Chưa chọn đơn nào để in';
  const w = window.open('', '_blank');
  if (!w) return 'Trình duyệt chặn cửa sổ in — cho phép pop-up rồi bấm lại';
  w.document.write(buildLabelsHtml(orders, layout, window.location.origin));
  w.document.close();
  return null;
}
