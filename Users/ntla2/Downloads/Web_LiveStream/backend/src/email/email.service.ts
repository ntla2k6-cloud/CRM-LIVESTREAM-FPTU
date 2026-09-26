import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// 5 Status labels
export const STATUS_LABELS: Record<string, { label: string; location: string; emoji: string }> = {
  PACKED:       { label: 'Đã đóng gói',                      location: 'Kho Uống Gì Chưa',          emoji: '📦' },
  HANDED_OVER:  { label: 'Đã chuyển tới đơn vị vận chuyển',  location: 'Trung tâm phân loại hàng',  emoji: '🚉' },
  IN_TRANSIT:   { label: 'Đơn vị vận chuyển đang xử lý',     location: 'Đang trên đường vận chuyển', emoji: '🚚' },
  COMPLETED:    { label: 'Hoàn tất - Đã giao hàng',          location: 'Địa chỉ người nhận',         emoji: '✅' },
  RETURNED:     { label: 'Hoàn hàng - Giao thất bại',        location: 'Đang hoàn về kho',           emoji: '↩️' },
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      this.logger.log(`Email service initialized with SMTP: ${host}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable.');
    }
  }

  async sendStatusUpdate(shipment: any, newStatus: string): Promise<void> {
    if (!shipment.recipientEmail) {
      this.logger.log(`[EMAIL-SKIP] No email for shipment ${shipment.id}`);
      return;
    }

    const statusInfo = STATUS_LABELS[newStatus] || { label: newStatus, location: 'Đang cập nhật', emoji: '🔄' };
    const trackingUrl = `${process.env.TRACKING_BASE_URL || 'https://crm.student.fptu.mobot.app/tracking'}?code=${encodeURIComponent(shipment.trackingCode || shipment.id)}`;
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'uonggichua@fpt.edu.vn';
    const fromName = process.env.SMTP_FROM_NAME || 'Uống Gì Chưa';

    const subject = `[Cập nhật đơn hàng] ${statusInfo.emoji} ${statusInfo.label} — Đơn ${shipment.id}`;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        
        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#005691,#F58220);padding:32px 40px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🧋</div>
          <div style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Uống Gì Chưa</div>
          <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px;">Hệ thống theo dõi đơn hàng</div>
        </td></tr>

        <!-- STATUS BADGE -->
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">${statusInfo.emoji}</div>
          <div style="display:inline-block;background:#e8f4fd;color:#005691;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:700;">${statusInfo.label}</div>
        </td></tr>

        <!-- GREETING -->
        <tr><td style="padding:24px 40px;">
          <p style="color:#1a1a2e;font-size:17px;font-weight:600;margin:0 0 12px;">Xin chào ${shipment.recipientName || 'bạn'} 👋</p>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Đơn hàng <strong style="color:#005691;">${shipment.id}</strong> của bạn vừa được cập nhật trạng thái mới.
          </p>

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Trạng thái</span><br>
                <span style="color:#1a1a2e;font-size:15px;font-weight:700;margin-top:4px;display:block;">${statusInfo.emoji} ${statusInfo.label}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vị trí hiện tại</span><br>
                <span style="color:#1a1a2e;font-size:15px;font-weight:700;margin-top:4px;display:block;">📍 ${shipment.currentLocation || statusInfo.location}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Mã đơn hàng</span><br>
                <span style="color:#005691;font-size:15px;font-weight:700;margin-top:4px;display:block;font-family:monospace;">${shipment.id}</span>
              </td>
            </tr>
          </table>

          ${newStatus === 'IN_TRANSIT' && shipment.lastMileCarrier ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin:16px 0;padding:16px 20px;">
            <tr><td>
              <p style="color:#9a3412;font-weight:700;margin:0 0 8px;">📦 Giao hàng chặng cuối</p>
              <p style="color:#7c2d12;margin:0 0 4px;font-size:14px;">Đơn vị: <strong>${shipment.lastMileCarrier}</strong></p>
              ${shipment.lastMileTrackingCode ? `<p style="color:#7c2d12;margin:0 0 4px;font-size:14px;">Mã VĐ: <strong style="font-family:monospace;">${shipment.lastMileTrackingCode}</strong></p>` : ''}
            </td></tr>
          </table>
          ` : ''}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#005691,#0074bc);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
            📍 Theo dõi đơn hàng
          </a>
          <p style="color:#999;font-size:12px;margin-top:12px;">hoặc dán link: <a href="${trackingUrl}" style="color:#005691;">${trackingUrl}</a></p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#aaa;font-size:12px;margin:0;">Email tự động từ hệ thống <strong>Uống Gì Chưa</strong>. Vui lòng không trả lời email này.</p>
          <p style="color:#ccc;font-size:11px;margin:8px 0 0;">© 2026 Uống Gì Chưa — FPT University HCM</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: shipment.recipientEmail,
      subject,
      html,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`[EMAIL-SENT] ${shipment.id} → ${shipment.recipientEmail} (${newStatus})`);
      } catch (err: any) {
        this.logger.error(`[EMAIL-ERROR] Failed to send to ${shipment.recipientEmail}: ${err.message}`);
      }
    } else {
      // Dev fallback: log email content
      this.logger.log(`[EMAIL-DEV] Would send to: ${shipment.recipientEmail}`);
      this.logger.log(`[EMAIL-DEV] Subject: ${subject}`);
      this.logger.log(`[EMAIL-DEV] Status: ${newStatus} | Shipment: ${shipment.id}`);
    }
  }
}
