'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Truck, Box, Phone, Calendar, ArrowRight, X, Clock, MapPin, Heart, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export default function TrackingPage() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statuses = ['Đã tạo đơn', 'Đang lấy hàng', 'Đang vận chuyển', 'Đang giao', 'Đã giao', 'Giao chưa thành công'];

  const fetchOrder = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await api.get('/order/tracking/' + code);
      setOrder(res);
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e: any) {
      setOrder(null);
      setError(e.response?.data?.message || 'Mã không đúng hoặc đơn hàng không tồn tại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setTrackingCode(code);
      fetchOrder(code);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setError('Vui lòng nhập mã vận chuyển');
      return;
    }
    router.replace(`/tracking?code=${trackingCode}`);
    fetchOrder(trackingCode);
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

      {/* HERO SECTION */}
      <section className="bg-white pt-16 pb-24 relative overflow-hidden">
        {/* Background Patterns */}
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
                  placeholder="Dán mã vận chuyển của bạn vào đây..."
                  className="flex-1 h-14 bg-transparent outline-none px-4 text-slate-700 text-lg font-medium placeholder:text-slate-400"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                />
                <button type="submit" disabled={loading} className="h-14 px-8 bg-[#005691] hover:bg-[#004270] text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-70">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Tra mã'}
                </button>
              </form>
            </div>

            <div className="flex-1 hidden md:block relative">
              {/* Illustration Area */}
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

      {/* TRACKING RESULT */}
      <section id="result-section">
        <div className="container mx-auto px-4 md:px-8">
          
          {error && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 font-semibold max-w-3xl mx-auto shadow-sm">
              <X size={20} /> {error}
            </div>
          )}

          {order && (
            <div className="mt-12 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-4xl mx-auto overflow-hidden">
              <div className="bg-[#005691] p-6 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="text-blue-200 text-sm font-semibold mb-1">KẾT QUẢ TRA CỨU ĐƠN QUÀ</div>
                  <h3 className="text-2xl font-bold">{order.trackingCode}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded font-semibold text-sm">
                    {order.shippingProvider || 'Đang cập nhật đơn vị VC'}
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="text-sm text-blue-100 font-semibold mb-1">Người nhận</div>
                  <div className="text-xl font-bold mb-2">{order.recipient}</div>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1"><Phone size={14}/> {order.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</span>
                    {order.date && <span className="flex items-center gap-1"><Calendar size={14}/> {order.date.split(' ')[0]}</span>}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <MapPin className="text-[#F58220]" /> Lịch sử hành trình
                </h4>
                
                <div className="relative pl-8">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                  
                  <div className="space-y-8">
                    {(() => {
                      const baseSteps = [
                        { status: 'Đã tạo đơn', desc: 'Quà đã được tụi mình đóng gói xong! Một chút yêu thương đang chuẩn bị lên đường đến bạn 💖', icon: Box },
                        { status: 'Đang lấy hàng', desc: 'Quà đang được shipper đến lấy!', icon: Package },
                        { status: 'Đang vận chuyển', desc: 'Quà đang trên đường đến bạn! Kiên nhẫn xíu nha, cuộc gặp này sắp tới rồi 💨', icon: Truck },
                        { status: 'Đang giao', desc: 'TING TING! 🔔 Hình như quà đang ở rất gần bạn rồi đó!', icon: Clock },
                      ];
                      
                      const steps = order.status === 'Giao chưa thành công' 
                        ? [...baseSteps, { status: 'Giao chưa thành công', desc: 'Quà chưa đến được bạn ! Bạn kiểm tra lại thông tin nhận hàng và chờ shipper liên hệ nha', icon: X }]
                        : [...baseSteps, { status: 'Đã giao', desc: 'YAY! Bạn nhận được quà rồi! 🎉 Cảm ơn bạn đã cùng tụi mình tạo nên một buổi LIVE thật vui. Hẹn gặp lại bạn ở những thử thách tiếp theo nha!', icon: CheckCircle2 }];
                      
                      const currentStepIndex = steps.findIndex(s => s.status === order.status);
                      const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

                      return steps.map((step, idx) => {
                        const isCompleted = activeIndex >= idx;
                        const isCurrent = activeIndex === idx;
                        const Icon = step.icon;
                        
                        return (
                          <div key={idx} className="relative z-10 flex gap-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 transition-colors ${isCompleted ? (step.status === 'Giao chưa thành công' ? 'bg-red-500 text-white' : 'bg-[#F58220] text-white') : 'bg-slate-200 text-slate-400'}`}>
                              {isCompleted ? (step.status === 'Giao chưa thành công' ? <X size={16} /> : <CheckCircle2 size={16} />) : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <div className={`flex-1 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                              <h5 className={`font-bold text-lg ${isCurrent ? (step.status === 'Giao chưa thành công' ? 'text-red-600' : 'text-[#005691]') : 'text-slate-700'}`}>{step.status}</h5>
                              <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">{step.desc}</p>
                              
                              {isCurrent && step.status === 'Đang vận chuyển' && order.trackingLink && (
                                <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#005691] text-white rounded text-sm font-semibold hover:bg-[#004270] transition-colors">
                                  Xem trên trang {order.shippingProvider} <ArrowRight size={14}/>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
