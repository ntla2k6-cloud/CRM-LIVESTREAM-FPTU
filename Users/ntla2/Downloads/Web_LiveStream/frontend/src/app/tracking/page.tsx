'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, Package, CheckCircle2, Truck, Box, Phone, Calendar, ArrowRight, X, Clock, MapPin, Heart, ArrowLeft, AlertTriangle, Gift } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

// ============================================================
// STATUS CONFIG — tập trung, không if/else rải rác
// Khớp chính xác với giá trị status trong Database (tiếng Việt)
// ============================================================
const STATUS_CONFIG: Record<string, {
  title: string;
  emoji: string;
  message: string;
  color: string;
  bgColor: string;
  isFailed?: boolean;
}> = {
  'Đã tạo đơn': {
    title: 'ĐÃ TẠO ĐƠN',
    emoji: '🎁',
    message: 'Quà đã được tụi mình đóng gói xong!\nMột chút yêu thương đang chuẩn bị lên đường đến bạn 💗',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
  },
  'Đang lấy hàng': {
    title: 'ĐANG LẤY HÀNG',
    emoji: '📦',
    message: 'Quà đang được shipper đến lấy!',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
  },
  'Đang vận chuyển': {
    title: 'ĐANG VẬN CHUYỂN',
    emoji: '🚚',
    message: 'Quà đang trên đường đến bạn!\nKiên nhẫn xíu nha, cuộc gặp này sắp tới rồi 💨',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500',
  },
  'Đang giao': {
    title: 'ĐANG GIAO',
    emoji: '🏠',
    message: 'TING TING! 🔔\nHình như quà đang ở rất gần bạn rồi đó!',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
  },
  'Đã giao': {
    title: 'ĐÃ GIAO',
    emoji: '✅',
    message: 'YAY! Bạn nhận được quà rồi! 🎉\n\nCảm ơn bạn đã cùng tụi mình tạo nên một buổi LIVE thật vui.\nHẹn gặp lại bạn ở những thử thách tiếp theo nha!',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
  },
  'Giao chưa thành công': {
    title: 'GIAO CHƯA THÀNH CÔNG',
    emoji: '⚠️',
    message: 'Quà chưa đến được bạn!\n\nBạn kiểm tra lại thông tin nhận hàng và chờ shipper liên hệ nha.',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    isFailed: true,
  },
};

// Timeline steps (thứ tự chuẩn)
const TIMELINE_STEPS = [
  { status: 'Đã tạo đơn', emoji: '🎁', label: 'Đã tạo đơn' },
  { status: 'Đang lấy hàng', emoji: '📦', label: 'Đang lấy hàng' },
  { status: 'Đang vận chuyển', emoji: '🚚', label: 'Đang vận chuyển' },
  { status: 'Đang giao', emoji: '🏠', label: 'Đang giao' },
  { status: 'Đã giao', emoji: '✅', label: 'Đã giao' },
];

const STATUS_ORDER = ['Đã tạo đơn', 'Đang lấy hàng', 'Đang vận chuyển', 'Đang giao', 'Đã giao'];

export default function TrackingPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  // Prevent double request
  const fetchingRef = useRef(false);

  const fetchOrder = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    if (fetchingRef.current) return; // prevent double call
    
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await api.get('/order/tracking/' + encodeURIComponent(trimmed));
      const data = res?.data;
      
      if (!data || typeof data !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
      }
      
      // Log unknown status for developer
      if (data.status && !STATUS_CONFIG[data.status]) {
        console.warn('[Tracking] Unknown status from API:', data.status, '— using fallback');
      }
      
      setOrder(data);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (e: any) {
      setOrder(null);
      const msg = e?.response?.data?.message || e?.message || '';
      if (msg.toLowerCase().includes('không tìm thấy') || e?.response?.status === 404) {
        setError('Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại mã đơn hoặc số điện thoại và thử lại nhé.');
      } else {
        setError('Có lỗi khi tra cứu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Only run once on mount — read ?code= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setInput(code);
      fetchOrder(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Vui lòng nhập mã vận chuyển, mã đơn hoặc số điện thoại.');
      return;
    }
    // Update URL without triggering re-fetch via useEffect
    window.history.replaceState(null, '', `/tracking?code=${encodeURIComponent(trimmed)}`);
    fetchOrder(trimmed);
  };

  // ---- Computed display values ----
  const statusCfg = order?.status ? (STATUS_CONFIG[order.status] ?? {
    title: 'ĐANG CẬP NHẬT',
    emoji: '🔄',
    message: 'Đơn hàng đang được cập nhật. Vui lòng quay lại sau nhé!',
    color: 'text-slate-600',
    bgColor: 'bg-slate-400',
  }) : null;

  const isFailed = order?.status === 'Giao chưa thành công';

  // Compute timeline step index for non-failed orders
  const currentStepIdx = order ? STATUS_ORDER.indexOf(order.status) : -1;

  const maskedPhone = (phone: string) => {
    if (!phone) return 'Chưa có SĐT';
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans selection:bg-[#005691] selection:text-white">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-[#005691] transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F58220] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Package size={22} />
            </div>
            <h1 className="text-xl font-bold text-[#005691]">FPTU Tracking</h1>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50 to-transparent pointer-events-none" />
        <div className="absolute -right-48 -top-48 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-[#F58220] rounded-full font-bold text-sm mb-6 uppercase tracking-wider">
                🎉 CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#005691] leading-tight mb-6">
                Cảm ơn bạn đã tham gia thử thách <br className="hidden md:block"/>
                và đồng hành cùng chương trình.
              </h2>
              <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto md:mx-0">
                Cùng xem phần quà đang trên đường đến bạn nhé! 🎁
              </p>

              <form onSubmit={handleSearch} className="max-w-xl mx-auto md:mx-0 relative flex items-center shadow-2xl shadow-blue-900/5 rounded-2xl bg-white border-2 border-slate-100 focus-within:border-[#005691] focus-within:ring-4 ring-blue-100 transition-all p-2">
                <input
                  type="text"
                  placeholder="Nhập mã vận đơn, mã đơn (DON-xxx) hoặc số điện thoại..."
                  className="flex-1 h-14 bg-transparent outline-none px-4 text-slate-700 text-base font-medium placeholder:text-slate-400"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 px-8 bg-[#005691] hover:bg-[#004270] text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-70 shrink-0"
                >
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang tra...</span></>
                    : <><Search size={18} /><span>Tra mã</span></>
                  }
                </button>
              </form>
              <p className="text-xs text-slate-400 mt-3 ml-2">
                Nhập mã vận đơn GHTK/Viettel Post, mã đơn DON-xxx, hoặc số điện thoại đăng ký nhận quà
              </p>
            </div>

            <div className="flex-1 hidden md:block relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-orange-100 rounded-[3rem] rotate-6 scale-95 opacity-50"></div>
                <div className="absolute inset-0 bg-[#005691] rounded-[3rem] -rotate-3 transition-transform hover:rotate-0 duration-500"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-6">
                  <Package size={100} className="text-[#005691]" />
                </div>
                <div className="absolute bottom-10 left-0 w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center -rotate-12 animate-bounce">
                  <Truck size={40} className="text-[#F58220]" />
                </div>
                <div className="absolute top-10 right-0 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center rotate-12">
                  <Clock size={30} className="text-green-500" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RESULT */}
      <section ref={resultRef} className="container mx-auto px-4 md:px-8 pb-20">

        {/* Error state */}
        {error && !order && (
          <div className="mt-8 p-5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 font-semibold max-w-3xl mx-auto shadow-sm">
            <X size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success result */}
        {order && statusCfg && (
          <div className="mt-12 max-w-4xl mx-auto space-y-6">

            {/* Congrats banner */}
            <div className="bg-gradient-to-r from-[#005691] to-[#0074bc] rounded-2xl p-6 text-white text-center shadow-xl">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!</h2>
              <p className="text-blue-200 text-base">Cảm ơn bạn đã tham gia thử thách và đồng hành cùng chúng mình.</p>
            </div>

            {/* Order card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

              {/* Card header */}
              <div className="bg-[#005691] p-6 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="text-blue-200 text-sm font-semibold mb-1">KẾT QUẢ TRA CỨU ĐƠN QUÀ</div>
                  <h3 className="text-2xl font-bold">{order.trackingCode || order.id}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded font-semibold text-sm">
                    {order.shippingProvider || 'Đang cập nhật đơn vị VC'}
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="text-sm text-blue-100 font-semibold mb-1">Người nhận</div>
                  <div className="text-xl font-bold mb-2">{order.recipient || 'Chưa cập nhật'}</div>
                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1"><Phone size={14}/> {maskedPhone(order.phone)}</span>
                    {order.date && <span className="flex items-center gap-1"><Calendar size={14}/> {order.date}</span>}
                  </div>
                </div>
              </div>

              {/* Gift info */}
              <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F58220] rounded-xl flex items-center justify-center text-white shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Phần quà của bạn</div>
                  <div className="text-base font-bold text-slate-800">{order.gift}</div>
                </div>
                {order.address && (
                  <div className="ml-auto text-right hidden md:block">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Địa chỉ nhận</div>
                    <div className="text-sm font-medium text-slate-700 max-w-[200px]">{order.address}</div>
                  </div>
                )}
              </div>

              {/* Current status highlight */}
              <div className={`mx-6 mt-6 rounded-xl p-5 ${isFailed ? 'bg-red-50 border border-red-200' : 'bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{statusCfg.emoji}</div>
                  <div>
                    <div className={`font-black text-lg mb-1 ${isFailed ? 'text-red-600' : 'text-[#005691]'}`}>
                      {statusCfg.title}
                    </div>
                    <div className="text-slate-600 text-sm md:text-base whitespace-pre-line leading-relaxed">
                      {statusCfg.message}
                    </div>
                    {!isFailed && order.trackingLink && (
                      <a href={order.trackingLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#005691] text-white rounded text-sm font-semibold hover:bg-[#004270] transition-colors">
                        Xem trên trang {order.shippingProvider} <ArrowRight size={14}/>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 md:p-10">
                <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <MapPin className="text-[#F58220]" /> Lịch sử hành trình
                </h4>

                {isFailed ? (
                  /* Failed state — separate display */
                  <div className="relative pl-8">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                    <div className="space-y-8">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isCompleted = idx <= 1; // show first 2 as done
                        const isCur = false;
                        return (
                          <div key={idx} className="relative z-10 flex gap-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 ${isCompleted ? 'bg-[#F58220] text-white' : 'bg-slate-200 text-slate-400'}`}>
                              {isCompleted ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <div className={`flex-1 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                              <h5 className="font-bold text-lg text-slate-700">{step.emoji} {step.label}</h5>
                            </div>
                          </div>
                        );
                      })}
                      {/* Failed step */}
                      <div className="relative z-10 flex gap-6">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 bg-red-500 text-white">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-lg text-red-600">⚠️ Giao chưa thành công</h5>
                          <p className="text-slate-500 font-medium mt-1 text-sm">Quà chưa đến được bạn. Vui lòng kiểm tra lại thông tin và chờ shipper liên hệ.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal timeline */
                  <div className="relative pl-8">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                    <div className="space-y-8">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const stepOrderIdx = STATUS_ORDER.indexOf(step.status);
                        const isCompleted = currentStepIdx >= 0 && stepOrderIdx <= currentStepIdx;
                        const isCur = currentStepIdx === stepOrderIdx;
                        return (
                          <div key={idx} className="relative z-10 flex gap-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 transition-colors ${isCompleted ? 'bg-[#F58220] text-white' : 'bg-slate-200 text-slate-400'}`}>
                              {isCompleted ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <div className={`flex-1 pb-2 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                              <h5 className={`font-bold text-lg ${isCur ? 'text-[#005691]' : 'text-slate-700'}`}>
                                {step.emoji} {step.label}
                              </h5>
                              {isCur && STATUS_CONFIG[step.status] && (
                                <p className="text-slate-500 font-medium mt-1 text-sm whitespace-pre-line">
                                  {STATUS_CONFIG[step.status].message}
                                </p>
                              )}
                              {isCur && (
                                <span className="inline-block mt-2 px-3 py-0.5 bg-[#F58220] text-white text-xs font-bold rounded-full">
                                  Trạng thái hiện tại
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer message */}
            <div className="bg-gradient-to-r from-[#F58220] to-orange-400 rounded-2xl p-6 text-white text-center shadow-lg">
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="text-xl font-black mb-2">QUÀ ĐANG TRÊN ĐƯỜNG ĐẾN BẠN!</h3>
              <p className="text-orange-100">Cảm ơn bạn đã đồng hành cùng chúng mình. Hẹn gặp lại bạn trong những hoạt động tiếp theo!</p>
            </div>

          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-[#14141F] text-slate-400 py-10">
        <div className="container mx-auto px-4 md:px-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="text-white font-bold text-xl mb-1">Tra mã vận đơn - FPTU HCM</div>
            <p className="text-sm">Hệ thống theo dõi quà tặng Livestream 2026</p>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Developed for FPT University HCM.
          </div>
        </div>
      </footer>

    </div>
  );
}
