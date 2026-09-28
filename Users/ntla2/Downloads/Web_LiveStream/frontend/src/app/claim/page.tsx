'use client';
import { useState, useEffect, Suspense } from 'react';
import { Gift, Search, MapPin, User, Phone, Mail, ArrowRight, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function ClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Vui lòng nhập Username TikTok hoặc Số điện thoại');
      return;
    }
    
    setLoading(true);
    setError('');
    setWinnerInfo(null);
    
    try {
      const res = await fetch('/api/claim?identifier=' + encodeURIComponent(identifier.trim()));
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error);
        if (data.claimed && data.trackingCode) {
          setTimeout(() => {
            router.push('/tracking?code=' + data.trackingCode);
          }, 2000);
        }
        return;
      }
      
      setWinnerInfo(data);
      setForm(prev => ({
        ...prev,
        name: data.customerName || '',
        phone: data.customerPhone || ''
      }));
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('identifier')) {
      handleSearch();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winnerInfo.id,
          name: form.name,
          phone: form.phone,
          address: form.address,
          email: form.email
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }
      
      setSuccessCode(data.trackingCode);
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu thông tin');
      setSubmitting(false);
    }
  };

  if (successCode) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Đăng ký nhận quà thành công!</h2>
        <p className="text-slate-600 mb-6">
          Thông tin của bạn đã được ghi nhận. Quà sẽ được đóng gói và gửi đi sớm nhất.
        </p>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mã Vận Đơn của bạn</p>
          <p className="text-2xl font-black text-[#005691] tracking-wider">{successCode}</p>
        </div>
        <button 
          onClick={() => router.push('/tracking?code=' + successCode)}
          className="w-full py-4 bg-[#F58220] hover:bg-[#e07010] text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
        >
          Theo dõi hành trình quà tặng <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 p-4 md:p-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-orange-100 text-[#F58220] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12">
          <Gift size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Nhận Quà Livestream</h1>
        <p className="text-slate-500 font-medium">Nhập Username TikTok hoặc SĐT để kiểm tra phần quà bạn đã trúng!</p>
      </div>

      {!winnerInfo ? (
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="VD: @nguyenvana hoặc 0987654321"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#F58220] focus:bg-white transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold mb-4 text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#005691] text-white rounded-2xl font-bold hover:bg-[#004370] transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Kiểm tra phần quà'}
          </button>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-6 flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm shrink-0">
              <PartyPopper size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase mb-1">Chúc mừng bạn đã trúng</p>
              <p className="text-lg font-black text-slate-800">{winnerInfo.giftName}</p>
              <p className="text-xs font-medium text-slate-500">Từ phiên: {winnerInfo.liveSessionName}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-1 block">Họ và tên người nhận *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#005691]" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-1 block">Số điện thoại *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#005691]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-1 block">Địa chỉ giao hàng (Cụ thể) *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3}
                  placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#005691] resize-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-1 block">Email (Không bắt buộc)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="Để nhận thông báo hành trình đơn"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#005691]" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-bold text-center mt-4">{error}</p>}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full mt-6 py-4 bg-[#F58220] text-white rounded-2xl font-bold hover:bg-[#e07010] transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : 'Xác nhận thông tin & Nhận quà'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ClaimPage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 font-sans selection:bg-orange-200 selection:text-orange-900">
      <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="animate-spin text-[#F58220]" /></div>}>
        <ClaimForm />
      </Suspense>
    </div>
  );
}