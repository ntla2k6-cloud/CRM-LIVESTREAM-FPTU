"use client"
import React, { useState, useMemo } from 'react';
import { 
  Calendar, CalendarIcon, ChevronLeft, ChevronRight, Plus, Users, 
  MoreHorizontal, Video, Edit3, Trash2, X, Clock,
  CheckCircle2, AlertCircle, MapPin, FileText, Download, DollarSign, 
  CheckSquare, Square, Shield, UserCheck, ClipboardList, ChevronDown, Save
} from "lucide-react";

import { ShiftAPI, StaffAPI } from '@/lib/api';

// DỮ LIỆU MẪU
const STAFF_ROLES = [
  { id: 'VJ_HOST', name: 'VJ / Host Livestream', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'CSKH', name: 'CSKH (Trực Comment)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'BIEN_TAP', name: 'Biên Tập', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'KY_THUAT', name: 'Kỹ Thuật', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'SAN_XUAT', name: 'Tổ Chức Sản Xuất', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'THU_KHO', name: 'Thủ Kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'MANAGER', name: 'Quản lý (Manager)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'ADMIN', name: 'Admin Hệ thống', color: 'bg-red-50 text-red-700 border-red-200' }
];

const getRoleBadge = (roleName: string) => {
  const role = STAFF_ROLES.find(r => r.name === roleName);
  return role ? role.color : 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'PAYROLL'>('CALENDAR');
  
  // REAL AUTH
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [sessionStaff, setSessionStaff] = useState<any>(null);
  
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSessionUser(data.user);
          setSessionStaff(data.staff);
        }
      })
      .catch(console.error);
  }, []);

  const isAdminOrProducer = sessionUser?.role === 'ADMIN' || sessionUser?.role === 'MANAGER' || sessionStaff?.role === 'Producer';
  
  // Current user's staff ID
  const myStaffId = sessionStaff?.id ? Number(sessionStaff.id) : null; 
  
  
  // API STATES
  const [staffList, setStaffList] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  
  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, shiftRes] = await Promise.all([
        StaffAPI.getAll(),
        ShiftAPI.getAll()
      ]);
      setStaffList(staffRes);
      
      const mappedShifts = shiftRes.map((s: any) => ({
        ...s,
        date: s.day,
        assigned: s.assignments?.map((a: any) => a.staffId) || [],
        status: s.status || 'Chưa bắt đầu',
        project: s.type || 'Khác',
      }));
      setShifts(mappedShifts);
      
      const regs: Record<number, string[]> = {};
      shiftRes.forEach((s: any) => {
        if (s.registered) {
          regs[s.id] = s.registered.map(Number);
        }
      });
      setRegistrations(regs);
    } catch (err) {
      console.error(err);
    }
  };
  
  // STATE: Đội hình đăng ký — { shiftId: [staffId, ...] }
  const [registrations, setRegistrations] = useState<Record<number, string[]>>({});

  // STATE: Bảng lương override
  const [payrollMonth, setPayrollMonth] = useState('ALL');
  const [payrollOverrides, setPayrollOverrides] = useState<any>({});

  // STATE: Drawer phân công
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<'OFFICIAL' | 'REGISTRATION'>('OFFICIAL');
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'error'|'success'} | null>(null);
  
  // STATE: Calendar navigation — tracks which month/year is being viewed
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());

  const goToPreviousMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCalendarDate(new Date());
  };

  const showToast = (msg: string, type: 'error'|'success' = 'error') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAssign = (staffId: any) => {
    if (!selectedShift) return;
    const currentAssigned = selectedShift.assigned || [];
    const newAssigned = currentAssigned.includes(staffId)
      ? currentAssigned.filter((id: any) => id !== staffId)
      : [...currentAssigned, staffId];
    setSelectedShift({ ...selectedShift, assigned: newAssigned });
  };

  const handleSaveShift = async () => {
    if (!selectedShift) return;
    try {
      const isExisting = typeof selectedShift.id === 'string' && shifts.some(s => s.id === selectedShift.id);
      
      const payload = {
        title: selectedShift.title,
        time: selectedShift.time,
        day: selectedShift.date,
        month: selectedShift.month || (calendarDate.getMonth() + 1),
        year: selectedShift.year || calendarDate.getFullYear(),
        type: selectedShift.project || 'Khác',
        color: selectedShift.color || 'blue',
        registered: typeof selectedShift.id === 'string' ? (registrations[selectedShift.id] || selectedShift.registered || []) : (selectedShift.registered || []),
        assignments: {
          deleteMany: {},
          create: (selectedShift.assigned || []).map((staffId: any) => ({ staffId: Number(staffId) }))
        }
      };

      if (isExisting) {
        await ShiftAPI.update(selectedShift.id, payload);
        fetchData();
        setSelectedShift(null);
        showToast('Cập nhật phân công thành công!', 'success');
      } else {
        const newShift = await ShiftAPI.create(payload);
        fetchData();
        setSelectedShift(null);
        showToast('Tạo ca trực thành công!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(`Lỗi: ${err.message || 'Có lỗi xảy ra khi lưu ca trực!'}`);
      if (err.message?.toLowerCase().includes('không tồn tại')) {
        setSelectedShift(null);
        fetchData();
      }
    }
  };

  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    if (confirm("Xóa ca trực này?")) {
      try {
        await ShiftAPI.delete(selectedShift.id);
        fetchData();
        setSelectedShift(null);
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Có lỗi xảy ra khi xóa!');
        if (err.message?.toLowerCase().includes('không tồn tại')) {
          setSelectedShift(null);
          fetchData();
        }
      }
    }
  };

  const handleToggleRegistration = async (shiftId: any, staffId: any, isRegistered: boolean) => {
    // Optimistic UI Update
    setRegistrations(prev => {
      const current = prev[shiftId] || [];
      const updated = isRegistered
        ? current.filter(id => id !== staffId)
        : [...current, staffId];
      return { ...prev, [shiftId]: updated };
    });
    
    try {
      const action = isRegistered ? 'cancel' : 'register';
      const res = await fetch('/api/shift/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, action })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi khi lưu đăng ký ca trực!');
      }
      
      // Update with authoritative data from server
      setRegistrations(prev => ({
        ...prev,
        [shiftId]: data.registered.map(Number)
      }));
    } catch (e: any) {
      console.error(e);
      showToast(`Lỗi: ${e.message}`);
      if (e.message?.toLowerCase().includes('không tồn tại')) {
        setSelectedShift(null);
        fetchData();
      }
      // Revert optimistic update on failure by refetching
      const [shiftRes] = await Promise.all([ShiftAPI.getAll()]);
      const regs: Record<number, number[]> = {};
      shiftRes.forEach((s: any) => {
        if (s.registered) {
          try {
            const parsed = typeof s.registered === 'string' ? JSON.parse(s.registered) : s.registered;
            regs[s.id] = parsed.map(Number);
          } catch {
            regs[s.id] = [];
          }
        }
      });
      setRegistrations(regs);
    }
  };
  
  // Chuyển từ đội hình đăng ký sang đội hình chính thức
  const handleMoveToOfficial = (staffId: any) => {
    if (!selectedShift) return;
    if (!selectedShift.assigned?.includes(staffId)) {
      setSelectedShift({ ...selectedShift, assigned: [...(selectedShift.assigned || []), staffId] });
    }
  };

  const handlePayrollChange = (staffId: any, field: string, value: any) => {
    setPayrollOverrides((prev: any) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [field]: value
      }
    }));
  };

  // Tính toán bảng lương động
  const payrollData = useMemo(() => {
    return staffList.map(staff => {
      const overrides = payrollOverrides[staff.id] || {};
      
      const shiftsWorked = shifts.filter(s => s.assigned?.includes(staff.id));
      const totalShifts = shiftsWorked.length;
      
      const rate = overrides.rate !== undefined ? overrides.rate : 300000;
      const basePay = totalShifts * rate;
      const bonus = overrides.bonus !== undefined ? overrides.bonus : 0;
      const totalEarned = basePay + bonus;
      
      const paid = overrides.paid !== undefined ? overrides.paid : 0;
      const debt = totalEarned - paid;

      let status = overrides.status || 'Chưa thanh toán';
      if (overrides.status !== 'Thanh toán Tùy chỉnh') {
        if (paid === 0 && totalEarned > 0) status = 'Chưa thanh toán';
        else if (paid > 0 && paid < totalEarned) status = 'Thanh toán 1 phần';
        else if (paid >= totalEarned && totalEarned > 0) status = 'Đã thanh toán';
      }

      return {
        ...staff,
        shiftsWorked: totalShifts,
        rate,
        basePay,
        bonus,
        totalEarned,
        paid,
        debt,
        status
      };
    }).filter(p => payrollMonth === 'ALL' || p.shiftsWorked > 0);
  }, [shifts, payrollOverrides, payrollMonth]);

  const totalBudget = payrollData.reduce((sum, p) => sum + p.totalEarned, 0);
  const totalPaid = payrollData.reduce((sum, p) => sum + p.paid, 0);

  const handleSavePayroll = async () => {
    if (Object.keys(payrollOverrides).length === 0) {
      showToast('Không có thay đổi nào để lưu!', 'success');
      return;
    }
    
    try {
      const promises = Object.entries(payrollOverrides).map(async ([staffId, data]: [string, any]) => {
        if (data.rate !== undefined) {
          await StaffAPI.update(staffId, { rate: data.rate });
        }
      });
      await Promise.all(promises);
      
      showToast('Đã lưu Cập nhật Đơn giá Lương vào Database!', 'success');
      fetchData(); // Refresh to get real rates
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi lưu bảng lương: ' + (err.message || ''));
    }
  };

  const handleExportPayroll = () => {
    if (payrollData.length === 0) return;
    const header = ['Tên nhân sự', 'Vai trò', 'Giờ làm', 'Lương/Giờ', 'Thưởng', 'Tổng thu nhập', 'Đã thanh toán', 'Trạng thái'];
    const csvContent = "\uFEFF" + [
      header.join(','),
      ...payrollData.map(p => [
        `"${p.name}"`, 
        `"${p.role}"`, 
        p.hours, 
        p.rate, 
        p.bonus, 
        p.totalEarned, 
        p.paid, 
        `"${p.status}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Luong_${payrollMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 font-sans relative overflow-hidden h-full">
      
      {/* HEADER */}
      <div className="h-[88px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-[#005691]" /> Lịch LIVE & Bảng Nghiệm Thu
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Lịch phân công VJ, Kỹ Thuật, CSKH và Nghiệm thu lương</p>
        </div>
        
        <div className="flex gap-4 items-center">

          <div className="relative">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
              sessionUser?.role === 'ADMIN' ? 'bg-purple-50 border-purple-200 text-purple-700' :
              sessionUser?.role === 'MANAGER' ? 'bg-blue-50 border-blue-200 text-blue-700' :
              'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <Shield size={14} />
              {sessionUser?.role === 'ADMIN' ? 'Admin' : sessionUser?.role === 'MANAGER' ? 'Manager' : sessionStaff?.role || 'Thành viên'}
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'CALENDAR' ? 'bg-white shadow-sm text-[#005691]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Lịch Phân Công
            </button>
            <button 
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'PAYROLL' ? 'bg-white shadow-sm text-[#00A859]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <DollarSign size={16} /> Bảng Nghiệm Thu
            </button>
          </div>
          
          {activeTab === 'CALENDAR' && isAdminOrProducer && (
            <button 
              onClick={() => { setSelectedShift({ id: Date.now(), date: new Date().getDate(), month: calendarDate.getMonth() + 1, year: calendarDate.getFullYear(), title: 'Phiên LIVE Mới', time: '19:00 - 21:00', location: 'Studio A', status: 'Chưa bắt đầu', assigned: [] }); setDrawerTab('OFFICIAL'); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F58220] hover:bg-[#e07010] rounded-xl text-sm font-bold text-white shadow-md shadow-orange-900/20 transition-all hover:-translate-y-0.5"
            >
              <Plus size={16} /> Tạo ca trực mới
            </button>
          )}
          
          {activeTab === 'PAYROLL' && (
            <>
              {isAdminOrProducer && (
                <button onClick={handleSavePayroll} className="flex items-center gap-2 px-5 py-2.5 bg-[#005691] hover:bg-[#004070] rounded-xl text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5">
                  <Save size={16} /> Lưu Thay Đổi
                </button>
              )}
              <button onClick={handleExportPayroll} className="flex items-center gap-2 px-5 py-2.5 bg-[#00A859] hover:bg-[#00904c] rounded-xl text-sm font-bold text-white shadow-md shadow-green-900/20 transition-all hover:-translate-y-0.5">
                <Download size={16} /> Xuất Excel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 relative min-h-0">
        <div className="max-w-[1400px] mx-auto">
          
          {/* TAB 1: CALENDAR VIEW */}
          {activeTab === 'CALENDAR' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">Tháng {calendarDate.getMonth() + 1}, {calendarDate.getFullYear()}</h2>
                <div className="flex gap-2">
                  <button onClick={goToPreviousMonth} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"><ChevronLeft size={20}/></button>
                  <button onClick={goToToday} className="px-4 font-bold text-sm bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm">Hôm nay</button>
                  <button onClick={goToNextMonth} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"><ChevronRight size={20}/></button>
                </div>
              </div>

              <div className="grid min-w-[800px] grid-cols-7 gap-3">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(day => (
                  <div key={day} className="text-center font-black text-[11px] text-slate-400 uppercase tracking-widest py-3 border-b-2 border-slate-100 mb-2">
                    {day}
                  </div>
                ))}
                
                {(() => {
                  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                  let firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                  firstDay = firstDay === 0 ? 6 : firstDay - 1; 
                  
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="min-h-[160px] bg-slate-50/50 rounded-2xl border border-slate-100 p-3 opacity-50"></div>);
                  }
                  
                  for (let i = 1; i <= daysInMonth; i++) {
                    const day = i;
                    const dayShifts = shifts.filter(s => 
                      s.date === day && 
                      (s.month ? s.month === calendarDate.getMonth() + 1 : true) && 
                      (s.year ? s.year === calendarDate.getFullYear() : true)
                    );
                    const isToday = day === new Date().getDate() && calendarDate.getMonth() === new Date().getMonth() && calendarDate.getFullYear() === new Date().getFullYear();
                    
                    cells.push(
                      <div 
                        key={`day-${i}`} 
                        onClick={() => {
                          if (!isAdminOrProducer) return;
                          setSelectedShift({ 
                            id: Date.now(), 
                            date: day, 
                            month: calendarDate.getMonth() + 1,
                            year: calendarDate.getFullYear(),
                            title: 'Phiên LIVE Mới', 
                            time: '19:00 - 21:00', 
                            location: 'Studio A', 
                            status: 'Chưa bắt đầu', 
                            assigned: [] 
                          });
                          setDrawerTab('OFFICIAL');
                        }}
                        className={`min-h-[160px] bg-white rounded-2xl border ${isToday ? 'border-[#F58220] ring-4 ring-orange-50/50 shadow-sm' : 'border-slate-200'} p-3 ${isAdminOrProducer ? 'hover:shadow-lg hover:border-[#F58220]/50 cursor-pointer group/day' : ''} transition-all duration-300 flex flex-col`}
                      >
                        <div className="flex justify-between items-start mb-2 shrink-0">
                          <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-[#F58220] text-white shadow-md shadow-orange-500/20' : `text-slate-400 ${isAdminOrProducer ? 'group-hover/day:bg-orange-50 group-hover/day:text-[#F58220]' : ''}`}`}>
                            {day}
                          </span>
                          {isAdminOrProducer && (
                            <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-all hover:bg-orange-100 hover:text-[#F58220] scale-90 hover:scale-100">
                              <Plus size={14} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2 overflow-auto custom-scrollbar pr-1">
                          {dayShifts.map((shift, idx) => {
                            const assignedStaff = shift.assigned?.map((id: string) => staffList.find(s => s.id === id)).filter(Boolean) || [];
                            const maxAvatars = 3;
                            const displayAvatars = assignedStaff.slice(0, maxAvatars);
                            const extraCount = assignedStaff.length - maxAvatars;
  
                            const isDone = shift.status === 'Hoàn thành';
                            const isCanceled = shift.status === 'Đã hủy';
                            
                            const getThemeColors = (c: string) => {
                              const themes: Record<string, any> = {
                                'green': { 
                                  bg: 'bg-emerald-50/80', border: 'border-emerald-500',
                                  title: 'text-emerald-950', timeBg: 'bg-emerald-100', timeText: 'text-emerald-800', 
                                  project: 'text-emerald-600'
                                },
                                'orange': { 
                                  bg: 'bg-orange-50/80', border: 'border-orange-500',
                                  title: 'text-orange-950', timeBg: 'bg-orange-100', timeText: 'text-orange-800', 
                                  project: 'text-orange-600'
                                },
                                'pink': { 
                                  bg: 'bg-pink-50/80', border: 'border-pink-500',
                                  title: 'text-pink-950', timeBg: 'bg-pink-100', timeText: 'text-pink-800', 
                                  project: 'text-pink-600'
                                },
                                'blue': { 
                                  bg: 'bg-blue-50/80', border: 'border-blue-500',
                                  title: 'text-blue-950', timeBg: 'bg-blue-100', timeText: 'text-blue-800', 
                                  project: 'text-blue-600'
                                },
                                'purple': { 
                                  bg: 'bg-purple-50/80', border: 'border-purple-500',
                                  title: 'text-purple-950', timeBg: 'bg-purple-100', timeText: 'text-purple-800', 
                                  project: 'text-purple-600'
                                },
                              };
                              return themes[c] || themes['blue'];
                            };
                            const theme = getThemeColors(shift.color || 'blue');
  
                            return (
                              <div 
                                key={idx} 
                                onClick={(e) => { e.stopPropagation(); setSelectedShift(shift); setDrawerTab('REGISTRATION'); }}
                                className={`group/shift p-2.5 rounded-lg cursor-pointer transition-all border-l-[3px] border-y border-r border-y-transparent border-r-transparent hover:shadow-md hover:bg-white ${
                                  isDone ? `${theme.bg} ${theme.border} opacity-60` :
                                  isCanceled ? 'bg-slate-50 border-slate-300 opacity-50 grayscale' :
                                  `${theme.bg} ${theme.border}`
                                }`}
                              >
                                <div className="flex flex-col gap-1.5 mb-2">
                                  <div className="flex items-center justify-between">
                                    {shift.project && (
                                      <span className={`text-[9px] font-black uppercase tracking-wider ${theme.project}`}>
                                        {shift.project}
                                      </span>
                                    )}
                                    {(!isDone && !isCanceled) && (
                                      <span className="relative flex h-1.5 w-1.5 mr-1">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75 ${theme.project}`}></span>
                                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-current ${theme.project}`}></span>
                                      </span>
                                    )}
                                  </div>
                                  <div className={`flex w-fit items-center gap-1 px-1.5 py-0.5 rounded ${theme.timeBg} ${theme.timeText} font-bold text-[10px] whitespace-nowrap`}>
                                    <Clock size={10} className="opacity-70" />
                                    {shift.time}
                                  </div>
                                </div>
                                
                                <p className={`text-xs font-bold leading-snug line-clamp-2 mb-2 transition-colors ${isCanceled ? 'text-slate-400 line-through' : `${theme.title}`}`}>
                                  {shift.title}
                                </p>
                                
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100/50">
                                  <div className="flex -space-x-1.5">
                                    {displayAvatars.map((s, idx2) => {
                                      const avatarBg = getRoleBadge(s.role).split(' ')[0].replace('100', '500');
                                      return (
                                        <div key={idx2} className={`w-[22px] h-[22px] rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white ${avatarBg} shadow-sm`}>
                                          {s.name.split(' ').pop()?.[0]}
                                        </div>
                                      );
                                    })}
                                    {extraCount > 0 && (
                                      <div className="w-[22px] h-[22px] rounded-full ring-2 ring-white flex items-center justify-center text-[8px] font-bold bg-slate-100 text-slate-600 shadow-sm">
                                        +{extraCount}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                    {assignedStaff.length} người
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          )}

          {/* TAB 2: PAYROLL VIEW */}
          {activeTab === 'PAYROLL' && (
            <div className="animate-in fade-in duration-500 flex flex-col gap-6">
              
              {/* Thống kê Tổng quan (Summary Cards) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005691] flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Tổng Lương Cần Trả</p>
                    <p className="text-2xl font-black text-slate-900">{totalBudget.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#00A859] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Đã Thanh Toán</p>
                    <p className="text-2xl font-black text-[#00A859]">{totalPaid.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${totalBudget - totalPaid > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Tổng Dư Nợ</p>
                    <p className={`text-2xl font-black ${totalBudget - totalPaid > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                      {(totalBudget - totalPaid).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  {totalBudget - totalPaid > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full pointer-events-none"></div>}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex gap-3 items-center">
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                      <DollarSign size={16} className="text-[#00A859]" /> Bảng Kê Chi Tiết
                    </h3>
                  </div>
                  <select 
                    value={payrollMonth}
                    onChange={e => setPayrollMonth(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#00A859]/20 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <option value="9/2026">Tháng 9/2026</option>
                    <option value="8/2026">Tháng 8/2026</option>
                    <option value="ALL">Tất cả các tháng (Lũy kế)</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <th className="p-4 border-b border-slate-100 w-[250px]">Nhân sự</th>
                        <th className="p-4 border-b border-slate-100 text-center w-[80px]">Số Ca</th>
                        <th className="p-4 border-b border-slate-100 w-[140px]">Đơn Giá / Ca</th>
                        <th className="p-4 border-b border-slate-100 w-[140px]">Thưởng (Bonus)</th>
                        <th className="p-4 border-b border-slate-100 w-[160px] text-[#005691]">Tổng Thu Nhập</th>
                        <th className="p-4 border-b border-slate-100 w-[160px] text-green-600 bg-green-50/30">Đã Thanh Toán</th>
                        <th className="p-4 border-b border-slate-100 text-right pr-6">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {payrollData.map((staff, idx) => {
                        const avatarBg = getRoleBadge(staff.role).split(' ')[0].replace('100', '500');
                        return (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            
                            {/* NHÂN SỰ */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-inner shrink-0 ${avatarBg}`}>
                                  {staff.name.split(' ').pop()?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-none mb-1.5">{staff.name}</p>
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase border ${getRoleBadge(staff.role)}`}>
                                    {staff.role}
                                  </span>
                                </div>
                              </div>
                            </td>
                            
                            {/* SỐ CA */}
                            <td className="p-4 text-center">
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-[#F58220] font-black">
                                {staff.shiftsWorked}
                              </div>
                            </td>
                            
                            {/* ĐƠN GIÁ */}
                            <td className="p-4">
                              {payrollMonth === 'ALL' ? (
                                <span className="font-bold text-slate-600">{staff.rate.toLocaleString('vi-VN')} ₫</span>
                              ) : (
                                <div className="relative flex items-center">
                                  <input 
                                    type="number" 
                                    value={staff.rate || ''}
                                    placeholder="0"
                                    onChange={e => handlePayrollChange(staff.id, 'rate', parseInt(e.target.value) || 0)}
                                    className="w-28 bg-transparent border border-transparent hover:border-slate-200 focus:border-[#005691] focus:bg-white rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-none transition-all placeholder-slate-300"
                                  />
                                  <span className="absolute right-3 text-slate-400 text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">₫</span>
                                </div>
                              )}
                            </td>
                            
                            {/* BONUS */}
                            <td className="p-4">
                              {payrollMonth === 'ALL' ? (
                                <span className="font-bold text-slate-600">{staff.bonus.toLocaleString('vi-VN')} ₫</span>
                              ) : (
                                <div className="relative flex items-center">
                                  <input 
                                    type="number" 
                                    value={staff.bonus || ''}
                                    placeholder="0"
                                    onChange={e => handlePayrollChange(staff.id, 'bonus', parseInt(e.target.value) || 0)}
                                    className="w-28 bg-transparent border border-transparent hover:border-slate-200 focus:border-[#005691] focus:bg-white rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-none transition-all placeholder-slate-300"
                                  />
                                  <span className="absolute right-3 text-slate-400 text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">₫</span>
                                </div>
                              )}
                            </td>
                            
                            {/* TỔNG THU NHẬP */}
                            <td className="p-4">
                              <span className="font-black text-[#005691] text-[15px]">{staff.totalEarned.toLocaleString('vi-VN')} ₫</span>
                            </td>
                            
                            {/* ĐÃ THANH TOÁN */}
                            <td className="p-4 bg-green-50/10">
                              {payrollMonth === 'ALL' ? (
                                <span className="font-black text-[#00A859]">{staff.paid.toLocaleString('vi-VN')} ₫</span>
                              ) : (
                                <div className="relative flex items-center">
                                  <input 
                                    type="number" 
                                    value={staff.paid || ''}
                                    placeholder="0"
                                    onChange={e => handlePayrollChange(staff.id, 'paid', parseInt(e.target.value) || 0)}
                                    className="w-28 bg-transparent border border-transparent hover:border-green-200 focus:border-[#00A859] focus:bg-white rounded-lg px-3 py-1.5 font-black text-[#00A859] outline-none transition-all placeholder-green-200"
                                  />
                                  <span className="absolute right-3 text-green-500 text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">₫</span>
                                </div>
                              )}
                            </td>
                            
                            {/* TRẠNG THÁI & NỢ */}
                            <td className="p-4 pr-6 text-right">
                              <div className="flex flex-col items-end gap-1.5 justify-center">
                                <div className="relative inline-block">
                                  <select 
                                    value={staff.status}
                                    onChange={e => handlePayrollChange(staff.id, 'status', e.target.value)}
                                    className={`appearance-none text-[11px] font-black uppercase tracking-wider rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer border transition-colors shadow-sm ${
                                      staff.status === 'Đã thanh toán' ? 'bg-[#00A859] text-white border-[#00A859]' : 
                                      staff.status === 'Chưa thanh toán' ? 'bg-red-500 text-white border-red-500' :
                                      'bg-[#F58220] text-white border-[#F58220]'
                                    }`}
                                  >
                                    <option value="Chưa thanh toán">Chưa thanh toán</option>
                                    <option value="Thanh toán 1 phần">Thanh toán 1 phần</option>
                                    <option value="Đã thanh toán">Đã thanh toán</option>
                                    <option value="Thanh toán Tùy chỉnh">Tùy chỉnh tay</option>
                                  </select>
                                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-white opacity-80">
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                  </div>
                                </div>
                                
                                {staff.debt > 0 && (
                                  <span className="text-[10px] font-black text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                    NỢ: {staff.debt.toLocaleString('vi-VN')} ₫
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SHIFT DRAWER (ASSIGN) */}
      {selectedShift && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Nền Overlay */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedShift(null)} />
          
          <div className="w-full sm:w-[520px] h-full bg-white flex flex-col max-w-full shadow-2xl animate-in slide-in-from-right relative z-10 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="px-6 pt-5 pb-0 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Chi tiết Ca Trực</h3>
                  <p className="text-xs font-bold text-slate-500">Ngày {selectedShift.date}/{selectedShift.month || (calendarDate.getMonth() + 1)}/{selectedShift.year || calendarDate.getFullYear()}</p>
                </div>
                <button onClick={() => setSelectedShift(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex gap-1">
                <button 
                  onClick={() => setDrawerTab('OFFICIAL')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-t border-l border-r ${drawerTab === 'OFFICIAL' ? 'bg-white text-[#005691] border-slate-200 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}
                >
                  <UserCheck size={14} /> Đội hình Chính thức ({selectedShift.assigned?.length || 0})
                </button>
                <button 
                  onClick={() => setDrawerTab('REGISTRATION')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-t border-l border-r ${drawerTab === 'REGISTRATION' ? 'bg-white text-[#F58220] border-slate-200 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}
                >
                  <ClipboardList size={14} /> Đội hình Đăng ký ({(registrations[selectedShift.id] || []).length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white space-y-5 min-h-0">
              
              {/* PHẦN THÔNG TIN CA — chỉ Admin/Producer chỉnh sửa */}
              {isAdminOrProducer && (
                <div className="space-y-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Chủ đề LIVE</label>
                    <input type="text" value={selectedShift.title} onChange={e => setSelectedShift({...selectedShift, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#005691] outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Thời gian</label>
                      <input type="text" value={selectedShift.time} onChange={e => setSelectedShift({...selectedShift, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái</label>
                      <select value={selectedShift.status} onChange={e => setSelectedShift({...selectedShift, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 outline-none">
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Hoàn thành">Đã Hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Dự án</label>
                      <select value={selectedShift.project || 'Khác'} onChange={e => setSelectedShift({...selectedShift, project: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 outline-none">
                        <option value="Học Thuật">Học Thuật</option>
                        <option value="Uống Gì CHƯA">Uống Gì CHƯA</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Màu sắc hiển thị</label>
                      <div className="flex items-center gap-3 px-2 py-2">
                        {[
                          { val: 'blue', code: 'bg-blue-500 ring-blue-200' },
                          { val: 'green', code: 'bg-emerald-500 ring-emerald-200' },
                          { val: 'orange', code: 'bg-orange-500 ring-orange-200' },
                          { val: 'pink', code: 'bg-pink-500 ring-pink-200' },
                          { val: 'purple', code: 'bg-purple-500 ring-purple-200' }
                        ].map(c => (
                          <button 
                            key={c.val}
                            onClick={() => setSelectedShift({...selectedShift, color: c.val})}
                            className={`w-7 h-7 rounded-full transition-all ${c.code} ${selectedShift.color === c.val || (!selectedShift.color && c.val === 'blue') ? 'ring-4 scale-110 shadow-sm' : 'hover:scale-110'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== TAB: ĐỘI HÌNH CHÍNH THỨC ====== */}
              {drawerTab === 'OFFICIAL' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <UserCheck size={16} className="text-[#005691]"/> Đội hình Chính thức
                    </h4>
                    {isAdminOrProducer && selectedShift.assigned?.length > 0 && (
                      <button onClick={() => setSelectedShift({...selectedShift, assigned: []})}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  
                  {/* Chips đội hình chính thức */}
                  <div className="min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-2.5 items-start">
                    {selectedShift.assigned?.length === 0 ? (
                      <div className="w-full text-center text-xs font-bold text-slate-400 py-4 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-slate-300">
                          <Users size={18} />
                        </div>
                        Chưa có ai trong Đội hình chính thức.
                      </div>
                    ) : (
                      selectedShift.assigned?.map((id: string) => {
                        const staff = staffList.find(s => s.id === id);
                        if (!staff) return null;
                        const roleColorClass = getRoleBadge(staff.role);
                        const avatarBg = roleColorClass.split(' ')[0].replace('100', '500');
                        return (
                          <div key={id} className="flex items-center gap-2 pr-1.5 pl-1 py-1 bg-white border border-slate-200 rounded-full shadow-sm hover:border-[#005691] transition-colors animate-in zoom-in-95 duration-200">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-inner ${avatarBg}`}>
                              {staff.name.split(' ').pop()?.[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-800 leading-none">{staff.name}</span>
                              <span className="text-[8px] font-black uppercase mt-0.5 text-slate-500">{staff.role}</span>
                            </div>
                            {isAdminOrProducer && (
                              <button onClick={() => handleToggleAssign(id)}
                                className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors ml-1">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Nguồn nhân sự — chỉ Admin/Producer mới thêm được */}
                  {isAdminOrProducer && (
                    <div>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <span className="flex-1 h-px bg-slate-200"></span> Nguồn nhân sự trống <span className="flex-1 h-px bg-slate-200"></span>
                      </h4>
                      <div className="space-y-4 max-h-[200px] overflow-auto pr-1">
                        {STAFF_ROLES.map(role => {
                          const availableStaff = staffList.filter(s => s.role === role.name && !selectedShift.assigned?.includes(s.id));
                          if (availableStaff.length === 0) return null;
                          return (
                            <div key={role.id}>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{role.name}</p>
                              <div className="flex flex-wrap gap-2">
                                {availableStaff.map(staff => (
                                  <button key={staff.id} onClick={() => handleToggleAssign(staff.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#005691] hover:bg-blue-50 hover:text-[#005691] transition-all group">
                                    <Plus size={14} className="text-slate-400 group-hover:text-[#005691]"/>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#005691]">{staff.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {staffList.filter(s => !selectedShift.assigned?.includes(s.id)).length === 0 && (
                          <div className="text-center text-xs font-bold text-green-500 py-4">🎉 Đã huy động toàn bộ nhân sự!</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ====== TAB: ĐỘI HÌNH ĐĂNG KÝ ====== */}
              {drawerTab === 'REGISTRATION' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ClipboardList size={16} className="text-[#F58220]"/> Đội hình Đăng ký
                    </h4>
                    {!isAdminOrProducer && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        Bạn chỉ thấy đăng ký của bản thân
                      </span>
                    )}
                  </div>

                  {/* Nút đăng ký cho thành viên */}
                  {myStaffId ? (
                    (() => {
                      const isUserRegistered = typeof selectedShift.id === 'string' 
                        ? (registrations[selectedShift.id] || []).includes(myStaffId)
                        : (selectedShift.registered || []).includes(myStaffId);
                      
                      return (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                          <p className="text-xs font-bold text-slate-600 mb-3">Bạn đăng ký ca này không?</p>
                          {isUserRegistered ? (
                            <button onClick={() => handleToggleRegistration(selectedShift.id, myStaffId, true)}
                              className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                              <X size={16} /> Hủy đăng ký ca này
                            </button>
                          ) : (
                            <button onClick={() => handleToggleRegistration(selectedShift.id, myStaffId, false)}
                              className="w-full py-2.5 bg-[#F58220] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-[#e07010] transition-colors shadow-md">
                              <CheckCircle2 size={16} /> Đăng ký tham gia ca này
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : isAdminOrProducer ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500">Tài khoản Admin/Producer của bạn chưa được liên kết với một Hồ sơ Nhân sự.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Vui lòng vào mục Nhân sự Ekip, tạo một nhân sự có Email trùng với Email đăng nhập của bạn để có thể tự đăng ký ca trực.</p>
                    </div>
                  ) : null}


                  {/* Danh sách đăng ký */}
                  <div>
                    {(() => {
                      const allRegs = typeof selectedShift.id === 'string' ? (registrations[selectedShift.id] || []) : (selectedShift.registered || []);
                      // Thành viên chỉ thấy đăng ký của bản thân
                      const visibleRegs = isAdminOrProducer ? allRegs : allRegs.filter(id => id === myStaffId);
                      
                      if (visibleRegs.length === 0) {
                        return (
                          <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
                            <ClipboardList size={32} className="opacity-30" />
                            <p className="text-xs font-bold">
                              {isAdminOrProducer ? 'Chưa có ai đăng ký ca này' : 'Bạn chưa đăng ký ca này'}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {isAdminOrProducer && (
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                              Tổng {visibleRegs.length} người đăng ký
                            </p>
                          )}
                          {visibleRegs.map(staffId => {
                            const staff = staffList.find(s => s.id === staffId);
                            if (!staff) return null;
                            const isAlreadyOfficial = selectedShift.assigned?.includes(staffId);
                            const roleColorClass = getRoleBadge(staff.role);
                            return (
                              <div key={staffId} className={`flex items-center justify-between p-3 rounded-xl border ${isAlreadyOfficial ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white ${roleColorClass.split(' ')[0].replace('100', '500')}`}>
                                    {staff.name.split(' ').pop()?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-800">{staff.name}</p>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleColorClass}`}>{staff.role}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isAlreadyOfficial ? (
                                    <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Chính thức
                                    </span>
                                  ) : isAdminOrProducer ? (
                                    <button onClick={() => handleMoveToOfficial(staffId)}
                                      className="text-[10px] font-bold text-[#005691] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                                      <Plus size={10} /> Thêm vào chính thức
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              {isAdminOrProducer && (
                <button onClick={handleDeleteShift} className="px-4 py-3 bg-white border border-slate-300 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-sm">Xóa ca</button>
              )}
              {isAdminOrProducer ? (
                <button onClick={handleSaveShift} className="flex-1 px-4 py-3 bg-[#F58220] text-white font-bold rounded-xl hover:bg-[#e07010] shadow-md transition-all text-sm flex justify-center items-center gap-2">Lưu phân công</button>
              ) : (
                <button onClick={() => setSelectedShift(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl transition-all text-sm">Đóng</button>
              )}
            </div>
                    </div>
        </div>
      )}
      
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[100]">
          {toastMessage.type === 'success' ? (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <p className="text-sm font-bold">{toastMessage.msg}</p>
        </div>
      )}
    </div>
  );
}
