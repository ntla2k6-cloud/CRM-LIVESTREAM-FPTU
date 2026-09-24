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

  const statuses = ['ÄĂ£ táº¡o Ä‘Æ¡n', 'Äang láº¥y hĂ ng', 'Äang váº­n chuyá»ƒn', 'Äang giao', 'ÄĂ£ giao', 'Giao chÆ°a thĂ nh cĂ´ng'];

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'KhĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n quĂ  vá»›i mĂ£ nĂ y. Vui lĂ²ng kiá»ƒm tra láº¡i!');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check URL parameter ?code=...
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setTrackingCode(codeFromUrl);
      fetchOrder(codeFromUrl);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(trackingCode);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTrackingCode(text);
    } catch (err) {
      console.log('Failed to read clipboard');
    }
  };

  const currentStep = order ? statuses.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-800">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="mr-2 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900" title="Quay lại">
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-[#F58220] rounded flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-[#005691]">FPTU Tracking</span>
          </div>
          <div className="hidden md:flex items-center gap-4 font-semibold text-slate-600">
            <a href="https://www.facebook.com/FPTU.HCM" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-colors group" title="Fanpage Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:fill-[#1877F2] transition-colors text-slate-700">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm">Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@daihocfpt_hcm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-black/5 hover:text-black transition-colors group" title="KĂªnh TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 448 512" fill="currentColor" className="group-hover:fill-black transition-colors text-slate-700">
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
              </svg>
              <span className="text-sm">TikTok</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION (tramavandon style) */}
      <section className="bg-[#FFF8F1] py-12 md:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            
            {/* Left Column: Text & Search */}
            <div className="w-full md:w-3/5 order-2 md:order-1 relative z-10">
              {!order ? (
                <>
                  <p className="text-lg text-[#F58220] mb-2 font-black uppercase tracking-wider">đŸ‰ ChĂºc má»«ng báº¡n Ä‘Ă£ chiáº¿n tháº¯ng!</p>
                  <h1 className="text-3xl md:text-4xl lg:text-4xl font-black text-[#005691] leading-tight mb-4">
                    Cáº£m Æ¡n báº¡n Ä‘Ă£ tham gia thá»­ thĂ¡ch<br/>vĂ  Ä‘á»“ng hĂ nh cĂ¹ng chĂºng mĂ¬nh.
                  </h1>
                  <p className="text-lg text-slate-600 mb-6 font-medium">CĂ¹ng xem pháº§n quĂ  Ä‘ang trĂªn Ä‘Æ°á»ng Ä‘áº¿n báº¡n nhĂ©! đŸ</p>
                </>
              ) : (
                <>
                  <p className="text-lg text-[#F58220] mb-2 font-black uppercase tracking-wider">đŸ QuĂ  Ä‘ang trĂªn Ä‘Æ°á»ng Ä‘áº¿n báº¡n!</p>
                  <h1 className="text-3xl md:text-4xl lg:text-4xl font-black text-[#005691] leading-tight mb-4">
                    Cáº£m Æ¡n báº¡n Ä‘Ă£ Ä‘á»“ng hĂ nh<br/>cĂ¹ng chĂºng mĂ¬nh.
                  </h1>
                  <p className="text-lg text-slate-600 mb-6 font-medium">Háº¹n gáº·p láº¡i báº¡n trong nhá»¯ng hoáº¡t Ä‘á»™ng tiáº¿p theo!</p>
                </>
              )}

              {/* SEARCH FORM */}
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full max-w-xl">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="DĂ¡n mĂ£ váº­n chuyá»ƒn cá»§a báº¡n vĂ o Ä‘Ă¢y..."
                    className="w-full h-14 pl-5 pr-20 rounded-xl border border-slate-300 focus:border-[#F58220] focus:ring-2 focus:ring-orange-500/20 outline-none text-lg font-semibold"
                  />
                  <button 
                    type="button" 
                    onClick={handlePaste}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 bg-slate-100 rounded text-sm"
                  >
                    DĂ¡n
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="h-14 px-8 bg-[#005691] hover:bg-[#004270] text-white font-bold rounded-xl whitespace-nowrap shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Tra mĂ£'}
                </button>
              </form>


            </div>

            {/* Right Column: Illustration */}
            <div className="w-full md:w-2/5 order-1 md:order-2 flex justify-center">
              {/* Using CSS shapes/lucide to create an illustration vibe since we don't have SVG assets */}
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-[#F58220]/10 rounded-full"></div>
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
                  <div className="text-blue-200 text-sm font-semibold mb-1">Káº¾T QUáº¢ TRA Cá»¨U ÄÆ N QUĂ€</div>
                  <h3 className="text-2xl font-bold">{order.trackingCode}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded font-semibold text-sm">
                    {order.shippingProvider || 'Äang cáº­p nháº­t Ä‘Æ¡n vá»‹ VC'}
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                  <div className="text-sm text-blue-100 font-semibold mb-1">NgÆ°á»i nháº­n</div>
                  <div className="text-xl font-bold mb-2">{order.recipient}</div>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1"><Phone size={14}/> {order.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</span>
                    {order.date && <span className="flex items-center gap-1"><Calendar size={14}/> {order.date.split(' ')[0]}</span>}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <h4 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <MapPin className="text-[#F58220]" /> Lá»‹ch sá»­ hĂ nh trĂ¬nh
                </h4>
                
                <div className="relative pl-8">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                  
                  <div className="space-y-8">
                    {(() => {
                      const baseSteps = [
                        { status: 'ÄĂ£ táº¡o Ä‘Æ¡n', desc: 'QuĂ  Ä‘Ă£ Ä‘Æ°á»£c tá»¥i mĂ¬nh Ä‘Ă³ng gĂ³i xong! Má»™t chĂºt yĂªu thÆ°Æ¡ng Ä‘ang chuáº©n bá»‹ lĂªn Ä‘Æ°á»ng Ä‘áº¿n báº¡n đŸ’—', icon: Box },
                        { status: 'Äang láº¥y hĂ ng', desc: 'QuĂ  Ä‘ang Ä‘Æ°á»£c shipper Ä‘áº¿n láº¥y!', icon: Package },
                        { status: 'Äang váº­n chuyá»ƒn', desc: 'QuĂ  Ä‘ang trĂªn Ä‘Æ°á»ng Ä‘áº¿n báº¡n! KiĂªn nháº«n xĂ­u nha, cuá»™c gáº·p nĂ y sáº¯p tá»›i rá»“i đŸ’¨', icon: Truck },
                        { status: 'Äang giao', desc: 'TING TING! đŸ”” HĂ¬nh nhÆ° quĂ  Ä‘ang á»Ÿ ráº¥t gáº§n báº¡n rá»“i Ä‘Ă³!', icon: Clock },
                      ];
                      
                      const steps = order.status === 'Giao chÆ°a thĂ nh cĂ´ng' 
                        ? [...baseSteps, { status: 'Giao chÆ°a thĂ nh cĂ´ng', desc: 'QuĂ  chÆ°a Ä‘áº¿n Ä‘Æ°á»£c báº¡n ! Báº¡n kiá»ƒm tra láº¡i thĂ´ng tin nháº­n hĂ ng vĂ  chá» shipper liĂªn há»‡ nha', icon: X }]
                        : [...baseSteps, { status: 'ÄĂ£ giao', desc: 'YAY! Báº¡n nháº­n Ä‘Æ°á»£c quĂ  rá»“i! đŸ‰ Cáº£m Æ¡n báº¡n Ä‘Ă£ cĂ¹ng tá»¥i mĂ¬nh táº¡o nĂªn má»™t buá»•i LIVE tháº­t vui. Háº¹n gáº·p láº¡i báº¡n á»Ÿ nhá»¯ng thá»­ thĂ¡ch tiáº¿p theo nha!', icon: CheckCircle2 }];
                      
                      const currentStepIndex = steps.findIndex(s => s.status === order.status);
                      const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

                      return steps.map((step, idx) => {
                        const isCompleted = activeIndex >= idx;
                        const isCurrent = activeIndex === idx;
                        const Icon = step.icon;
                        
                        return (
                          <div key={idx} className="relative z-10 flex gap-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 transition-colors ${isCompleted ? (step.status === 'Giao chÆ°a thĂ nh cĂ´ng' ? 'bg-red-500 text-white' : 'bg-[#F58220] text-white') : 'bg-slate-200 text-slate-400'}`}>
                              {isCompleted ? (step.status === 'Giao chÆ°a thĂ nh cĂ´ng' ? <X size={16} /> : <CheckCircle2 size={16} />) : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <div className={`flex-1 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                              <h5 className={`font-bold text-lg ${isCurrent ? (step.status === 'Giao chÆ°a thĂ nh cĂ´ng' ? 'text-red-600' : 'text-[#005691]') : 'text-slate-700'}`}>{step.status}</h5>
                              <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">{step.desc}</p>
                              
                              {isCurrent && step.status === 'Äang váº­n chuyá»ƒn' && order.trackingLink && (
                                <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#005691] text-white rounded text-sm font-semibold hover:bg-[#004270] transition-colors">
                                  Xem trĂªn trang {order.shippingProvider} <ArrowRight size={14}/>
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
            <div className="text-white font-bold text-xl mb-1">Tra mĂ£ váº­n Ä‘Æ¡n - FPTU HCM</div>
            <p className="text-sm">Há»‡ thá»‘ng theo dĂµi quĂ  táº·ng Livestream 2026</p>
          </div>
          <div className="text-sm">
            Â© {new Date().getFullYear()} Developed for FPT University HCM.
          </div>
        </div>
      </footer>

    </div>
  );
}


