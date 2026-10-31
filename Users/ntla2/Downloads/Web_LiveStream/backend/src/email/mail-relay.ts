// Render Free chặn cổng SMTP → nhờ frontend Vercel gửi (POST /api/internal/send-mail, khóa INTERNAL_API_KEY).
// Cùng giao diện sendMail như nodemailer để EmailService dùng chung.
export interface MailSender {
  sendMail(mail: { from?: string; to: string; subject: string; html: string }): Promise<unknown>;
}

export function relayTransport(url: string, internalKey: string, fetchImpl: typeof fetch = fetch): MailSender {
  return {
    async sendMail({ to, subject, html }) {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-internal-key': internalKey },
        body: JSON.stringify({ to, subject, html }),
        signal: AbortSignal.timeout(60_000),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Gửi mail qua Vercel lỗi ${res.status}`);
      return data;
    },
  };
}
