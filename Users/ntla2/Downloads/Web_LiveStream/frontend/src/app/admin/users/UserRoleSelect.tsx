"use client";

import { useState } from "react";
import { updateUserRole } from "./actions";

export function UserRoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const ROLES = [
    { value: "GUEST", label: "GUEST (Chờ duyệt)" },
    { value: "CSKH", label: "CSKH (Trực Comment/Lead)" },
    { value: "VJ_HOST", label: "VJ (Host Livestream)" },
    { value: "MANAGER", label: "QUẢN LÝ (Full Quyền)" },
    { value: "ADMIN", label: "ADMIN (Hệ thống)" }
  ];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRole(newRole);
    setIsUpdating(true);
    try {
      await updateUserRole(userId, newRole);
      // Có thể thêm toast thông báo thành công ở đây
    } catch (error) {
      console.error("Lỗi cập nhật quyền:", error);
      alert("Có lỗi xảy ra khi cập nhật quyền.");
      setRole(currentRole); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={isUpdating}
      className={`border rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#F58220] transition-colors
        ${role === 'GUEST' ? 'bg-slate-100 text-slate-500 border-slate-300' : ''}
        ${role === 'ADMIN' || role === 'MANAGER' ? 'bg-orange-50 text-[#F58220] border-orange-200' : ''}
        ${role === 'CSKH' || role === 'VJ_HOST' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
      `}
    >
      {ROLES.map(r => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
