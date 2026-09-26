'use client';
import { useRef, useState, useEffect } from 'react';
import {
  Package, Truck, CheckCircle2, X, Phone, Calendar, ArrowRight,
  Clock, MapPin, ArrowLeft, AlertTriangle, Gift, User, Home,
  ChevronRight, ExternalLink, RotateCcw
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

// ─── Status Config (Customer-facing EXACTLY 4 STEPS) ──────────────────────────────────────────────────────────
const CUSTOMER_MAPPING: Record<string, string> = {
  UNPACKED: 'RECEIVED',
  PACKED: 'PROCESSED',
  HANDED_OVER: 'SHIPPING',
  IN_TRANSIT: 'SHIPPING',
  COMPLETED: 'DELIVERED',
  RETURNED: 'RETURNED'
};

const STATUS_CONFIG: Record<string, {
  label: string; emoji: string; message: string;
  color: string; bg: string; badge: string; isFailed?: boolean;
}> = {
  RECEIVED: {
    label: 'Đã tiếp nhận',
    emoji: '📥',
    message: 'Hệ thống đã tiếp nhận thông tin gửi quà.',
    color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-400',
  },
  PROCESSED: {
    label: 'Đã xử lý',
    emoji: '🛠️',
    message: 'Quà đã được xử lý/chuẩn bị để bàn giao vận chuyển.',
    color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-500',
  },
  SHIPPING: {
    label: 'Đang vận chuyển',
    emoji: '🚚',
    message: 'Đơn vị vận chuyển đã nhận hàng và đang vận chuyển.',
    color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-500',
  },
  DELIVERED: {
    label: 'Đã giao',
    emoji: '✅',
    message: 'Bạn đã nhận được quà. Cảm ơn bạn đã đồng hành cùng chúng mình!',
    color: 'text-green-600', bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-500',
  },
  RETURNED: {
    label: 'Giao thất bại (Hoàn hàng)',
    emoji: '↩️',
    message: 'Quà chưa đến được bạn và đang được hoàn về kho.\nVui lòng liên hệ tụi mình để được hỗ trợ nhé!',
    color: 'text-red-600', bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-500',
    isFailed: true,
  },
};

const STATUS_ORDER = ['RECEIVED', 'PROCESSED', 'SHIPPING', 'DELIVERED'];

const maskedPhone = (phone: string) =>
  phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : 'Chưa có SĐT';

export default function TrackingPage() {
  const [input, setInput] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchOrder = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.get('/order/tracking/' + encodeURIComponent(trimmed));
      const data = res?.data;
      if (!data || typeof data !== 'object') throw new Error('Dữ liệu không hợp lệ');
      setOrder(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e: any) {
      setOrder(null);
      const status = e?.response?.status;
      if (status === 404 || e?.message?.includes('không tìm thấy')) {
        setError('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hoặc số điện thoại.');
      } else {
        setError('Có lỗi khi tra cứu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) { setInput(code); fetchOrder(code); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) { setError('Vui lòng nhập mã đơn, mã vận đơn hoặc số điện thoại.'); return; }
    window.history.replaceState(null, '', `/tracking?code=${encodeURIComponent(trimmed)}`);
    fetchOrder(trimmed);
  };

  // Computed Customer Mapping
  const mappedCustomerStatus = order?.status ? (CUSTOMER_MAPPING[order.status] || order.status) : null;
  const statusCfg = mappedCustomerStatus ? (STATUS_CONFIG[mappedCustomerStatus] ?? {
    label: mappedCustomerStatus, emoji: '🔄', message: 'Đơn hàng đang được cập nhật.',
    color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-400',
  }) : null;

  const currentStepIdx = mappedCustomerStatus ? STATUS_ORDER.indexOf(mappedCustomerStatus) : -1;
  const isReturned = mappedCustomerStatus === 'RETURNED';
  const isCompleted = mappedCustomerStatus === 'DELIVERED';
  const isInTransit = order?.status === 'IN_TRANSIT' || order?.status === 'HANDED_OVER';

  // Histories mapping
  let histories: any[] = [];
  if (order?.histories?.length > 0) {
    const seen = new Set();
    for (const h of order.histories) {
      const cStatus = CUSTOMER_MAPPING[h.status] || h.status;
      if (!seen.has(cStatus)) {
        seen.add(cStatus);
        histories.push({ ...h, customerStatus: cStatus, statusLabel: STATUS_CONFIG[cStatus]?.label || cStatus });
      }
    }
  } else if (order) {
    histories = [{ status: order.status, customerStatus: mappedCustomerStatus, statusLabel: statusCfg?.label, location: order.currentLocation || '', timeStr: order.date }];
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-[#005691] transition-colors p-1">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F58220] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#005691] leading-none">FPTU Tracking</h1>
              <p className="text-xs text-slate-400">Theo dõi đơn quà tặng</p>
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH HERO */}
      <section className="bg-gradient-to-br from-[#005691] to-[#003d6b] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-white text-2xl md:text-3xl font-black mb-2">CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!</h2>
          <p className="text-blue-200 mb-8 text-sm md:text-base">Tra cứu phần quà đang trên đường đến bạn 🎁</p>

          <form onSubmit={handleSearch} className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
            <input
              type="text"
              placeholder="Nhập mã đơn (DON-xxx), mã vận đơn hoặc số điện thoại..."
              className="flex-1 h-12 bg-transparent outline-none px-3 text-slate-700 text-sm font-medium placeholder:text-slate-400"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}
              className="h-12 px-6 bg-[#005691] hover:bg-[#004270] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-70 shrink-0">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang tìm...</span></>
                : <><ChevronRight size={16} /><span>Tra cứu</span></>
              }
            </button>
          </form>
          <p className="text-blue-300 text-xs mt-3">Hỗ trợ: Mã đơn DON-xxx · Mã GHTK/Viettel · Số điện thoại</p>
        </div>
      </section>

      {/* RESULTS */}
      <main ref={resultRef} className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">

        {/* Error */}
        {error && !order && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 font-medium max-w-2xl mx-auto">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {order && statusCfg && (
          <div className="space-y-5">

            {/* ══════════════════════════════════════════════════════
                BLOCK 1: TỔNG QUAN
            ══════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">

              {/* Blue header */}
              <div className="bg-gradient-to-r from-[#005691] to-[#0074bc] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Mã vận đơn</div>
                    <div className="text-2xl font-black tracking-tight">{order.trackingCode || order.id}</div>
                    {order.trackingCode && order.id !== order.trackingCode && (
                      <div className="text-blue-200 text-xs mt-1">Mã đơn: {order.id}</div>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm bg-white/20 border border-white/30`}>
                    {statusCfg.emoji} {statusCfg.label}
                  </div>
                </div>

                {(order.lastMileCarrier || order.shippingProvider) && (
                  <div className="mt-3 text-blue-100 text-sm">
                    🚚 Tuyến vận chuyển: <span className="font-bold text-white">{order.lastMileCarrier || order.shippingProvider}</span>
                  </div>
                )}
              </div>

              {/* 4 Info boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                    <User size={12} /> Người gửi
                  </div>
                  <div className="text-slate-800 font-bold text-sm">{order.senderName || 'Uống Gì Chưa'}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-tight">{(order.senderAddress || 'FPT University HCM').split(',')[0]}</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                    <Home size={12} /> Người nhận
                  </div>
                  <div className="text-slate-800 font-bold text-sm">{order.recipient || order.recipientName}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{maskedPhone(order.phone)}</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                    <MapPin size={12} /> Vị trí hiện tại
                  </div>
                  <div className="text-slate-800 font-bold text-sm leading-tight">{order.currentLocation || statusCfg.label}</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                    <Gift size={12} /> Phần quà
                  </div>
                  <div className="text-slate-800 font-bold text-sm leading-tight">{order.gift}</div>
                  {order.date && <div className="text-slate-400 text-xs mt-0.5">{order.date}</div>}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                BLOCK 2: HÀNH TRÌNH BƯU KIỆN (TIMELINE)
            ══════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
              <h3 className="text-slate-800 font-black text-lg mb-6 flex items-center gap-2">
                <Clock size={20} className="text-[#F58220]" /> Hành trình bưu kiện
              </h3>

              {histories.length > 0 ? (
                <div className="relative pl-8">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-slate-100" />

                  <div className="space-y-6">
                    {histories.map((h: any, idx: number) => {
                      const cfg = STATUS_CONFIG[h.customerStatus] ?? { emoji: '🔄', label: h.customerStatus || h.statusLabel || h.status || '', color: 'text-slate-600', badge: 'bg-slate-400' };
                      const isFirst = idx === 0;
                      return (
                        <div key={h.id || idx} className="relative flex gap-4">
                          {/* Dot */}
                          <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm text-sm ${isFirst ? cfg.badge + ' text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {isFirst ? cfg.emoji : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                          </div>

                          <div className={`flex-1 pb-1 ${isFirst ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h5 className={`font-bold text-base ${isFirst ? cfg.color : 'text-slate-600'}`}>
                                {h.statusLabel || cfg.label || h.customerStatus || h.status}
                              </h5>
                              <span className="text-slate-400 text-xs font-medium shrink-0">{h.timeStr}</span>
                            </div>
                            {h.location && (
                              <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                                <MapPin size={12} className="shrink-0" /> {h.location}
                              </p>
                            )}
                            {h.note && <p className="text-slate-400 text-xs mt-1 italic">{h.note}</p>}
                            {isFirst && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F58220] text-white text-xs font-bold rounded-full">
                                Trạng thái hiện tại
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* No history → show static progress steps */
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-slate-100" />
                  <div className="space-y-6">
                    {STATUS_ORDER.map((key, idx) => {
                      const cfg = STATUS_CONFIG[key]!;
                      const isCompleted2 = currentStepIdx >= idx;
                      const isCurrent = currentStepIdx === idx;
                      return (
                        <div key={key} className="relative flex gap-4">
                          <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm text-sm ${isCompleted2 ? (isCurrent ? cfg.badge + ' text-white' : 'bg-[#F58220] text-white') : 'bg-slate-200 text-slate-400'}`}>
                            {isCompleted2 ? (isCurrent ? cfg.emoji : <CheckCircle2 size={14} />) : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                          </div>
                          <div className={`flex-1 ${isCompleted2 ? 'opacity-100' : 'opacity-40'}`}>
                            <h5 className={`font-bold text-base ${isCurrent ? cfg.color : 'text-slate-600'}`}>{cfg.emoji} {cfg.label}</h5>
                            {isCurrent && <p className="text-slate-500 text-sm mt-0.5 whitespace-pre-line">{cfg.message}</p>}
                            {isCurrent && <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F58220] text-white text-xs font-bold rounded-full">Trạng thái hiện tại</span>}
                          </div>
                        </div>
                      );
                    })}
                    {isReturned && (
                      <div className="relative flex gap-4">
                        <div className="absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm bg-red-500 text-white text-sm">↩️</div>
                        <div className="flex-1">
                          <h5 className="font-bold text-base text-red-600">↩️ Hoàn hàng - Giao thất bại</h5>
                          <p className="text-slate-500 text-sm mt-0.5">{STATUS_CONFIG.RETURNED.message}</p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">Trạng thái hiện tại</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════
                BLOCK 3: GIAO HÀNG SỞ TẠI (chỉ hiện khi IN_TRANSIT)
            ══════════════════════════════════════════════════════ */}
            {isInTransit && (order.lastMileCarrier || order.lastMileTrackingCode) && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                <h3 className="text-orange-800 font-black text-lg mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-[#F58220]" /> Giao hàng sở tại
                </h3>
                <div className="space-y-3">
                  {order.lastMileCarrier && (
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm w-36 shrink-0">Đơn vị vận chuyển:</span>
                      <span className="font-bold text-slate-800">{order.lastMileCarrier}</span>
                    </div>
                  )}
                  {order.lastMileTrackingCode && (
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm w-36 shrink-0">Mã vận đơn NCC:</span>
                      <code className="font-bold text-[#005691] bg-blue-50 px-2 py-0.5 rounded font-mono">{order.lastMileTrackingCode}</code>
                    </div>
                  )}
                  {order.lastMileTrackingLink && (
                    <a href={order.lastMileTrackingLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-5 py-3 bg-[#F58220] hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">
                      <ExternalLink size={16} /> Theo dõi tiếp tại {order.lastMileCarrier || 'đơn vị vận chuyển'}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Success / failure banner */}
            {isCompleted ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center shadow-lg">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-xl font-black mb-2">ĐÃ GIAO HÀNG THÀNH CÔNG!</h3>
                <p className="text-green-100 text-sm">Cảm ơn bạn đã đồng hành cùng chúng mình. Hẹn gặp lại bạn ở những hoạt động tiếp theo!</p>
              </div>
            ) : isReturned ? (
              <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-6 text-white text-center shadow-lg">
                <div className="text-3xl mb-2">↩️</div>
                <h3 className="text-xl font-black mb-2">GIAO HÀNG CHƯA THÀNH CÔNG</h3>
                <p className="text-red-100 text-sm">Vui lòng liên hệ fanpage Uống Gì Chưa để được hỗ trợ nhanh nhất.</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#F58220] to-orange-400 rounded-2xl p-5 text-white text-center shadow-lg">
                <div className="text-2xl mb-2">🎁</div>
                <p className="font-bold">Quà của bạn đang trên đường! Tụi mình sẽ cập nhật trạng thái sớm nhất có thể.</p>
              </div>
            )}

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#14141F] text-slate-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="text-white font-bold text-lg mb-1">🧋 Uống Gì Chưa</div>
          <p className="text-sm">Hệ thống theo dõi quà tặng Livestream 2026 — FPT University HCM</p>
          <p className="text-xs mt-2 text-slate-600">© 2026 Developed for FPT University HCM.</p>
        </div>
      </footer>

    </div>
  );
}
