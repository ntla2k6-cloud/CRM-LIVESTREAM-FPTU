"use client"
import React, { useEffect, useState } from 'react';
import { User, Lock, Save, Camera, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => {
        if (s?.user) setUser(s.user);
      });
  }, []);

  const handleSave = () => {
    setToast('✅ Đã lưu thay đổi thông tin cá nhân!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 p-10 font-sans overflow-y-auto">
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-lg shadow-lg font-bold z-50 animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full pt-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cập nhật Hồ sơ Cá nhân</h1>
          <button 
            onClick={handleSave}
            className="bg-[#F58220] hover:bg-[#e07010] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>

        {/* AVATAR SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-[#00875A] flex items-center justify-center text-white font-black text-3xl">
            {user?.name?.[0]?.toUpperCase() || 'AD'}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 mb-1.5">Ảnh đại diện</h2>
            <p className="text-xs font-semibold text-slate-400 mb-4">Định dạng PNG, JPG hoặc GIF. Tối đa 5MB.</p>
            <div className="flex items-center gap-4">
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
                Tải ảnh lên
              </button>
              <button className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors">
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          
          {/* Thông tin cơ bản */}
          <div className="mb-10">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6">
              <User size={16} className="text-[#005691]" /> Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">HỌ VÀ TÊN</label>
                <input 
                  type="text" 
                  defaultValue={user?.name || 'Admin System'} 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#F58220] transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CHỨC VỤ / PHÒNG BAN</label>
                <input 
                  type="text" 
                  defaultValue={user?.department || 'Quản lý Vận hành LIVE'} 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#F58220] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">EMAIL (ĐĂNG NHẬP)</label>
                <input 
                  type="email" 
                  defaultValue={user?.email || 'admin@fpt.edu.vn'} 
                  disabled
                  className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SỐ ĐIỆN THOẠI</label>
                <input 
                  type="text" 
                  defaultValue={user?.phone || '0987.654.321'} 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#F58220] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full mb-8"></div>

          {/* Đổi mật khẩu */}
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6">
              <Lock size={16} className="text-red-500" /> Đổi mật khẩu
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MẬT KHẨU HIỆN TẠI</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MẬT KHẨU MỚI</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
