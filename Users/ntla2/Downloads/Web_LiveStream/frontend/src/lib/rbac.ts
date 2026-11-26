'use client';
import { useEffect, useState } from 'react';

// Phân quyền trang (RBAC) — 1 nguồn dùng chung cho Sidebar, menu điện thoại và RoleGuard.
// Cấu hình Admin sửa ở trang Nhân sự → lưu DB (AppSetting 'rbac_roles', API /api/rbac), áp cho MỌI người.
// Vai trò chưa có cấu hình → quyền mặc định bên dưới. ADMIN/MANAGER luôn toàn quyền.
// Bảo vệ dữ liệu thật vẫn ở backend (@Roles) — đây là chặn giao diện.

export type RbacConfig = Record<string, string[]>;

export const DEFAULT_PERMISSIONS: RbacConfig = {
  VJ_HOST: ['schedule.register', 'live.view'],
  CSKH: ['crm.view', 'crm.edit', 'cskh.view', 'cskh.process', 'schedule.register'],
  BIEN_TAP: ['live.view', 'live.script', 'schedule.register'],
  KY_THUAT: ['live.view', 'live.control', 'schedule.register'],
  SAN_XUAT: ['schedule.view', 'schedule.register', 'schedule.approve', 'schedule.manage', 'live.view', 'live.manage'],
  LIVE_MANAGER: ['live.view', 'live.manage', 'live.control', 'live.script', 'schedule.register'],
  THU_KHO: ['inventory.view', 'inventory.manage', 'inventory.export', 'schedule.register'],
};

const FULL_ACCESS = ['ADMIN', 'MANAGER'];

// Trang → cần ÍT NHẤT 1 quyền trong danh sách. '*' = mọi nhân sự đã duyệt. Trang không có ở đây = mọi nhân sự.
export const PAGE_RULES: Array<{ prefix: string; any: string[] | '*'; roles?: string[] }> = [
  { prefix: '/audit', any: [], roles: ['ADMIN'] },
  { prefix: '/settings', any: [], roles: ['ADMIN', 'MANAGER'] },
  { prefix: '/admin', any: ['admin.users', 'admin.approve', 'admin.rbac'] },
  { prefix: '/staff', any: ['admin.users', 'admin.approve', 'admin.rbac'] },
  { prefix: '/analytics', any: ['admin.analytics', 'live.view'] },
  { prefix: '/cskh', any: ['crm.view', 'crm.edit', 'crm.export', 'cskh.view', 'cskh.process', 'cskh.manage_orders'] },
  { prefix: '/inventory', any: ['inventory.view', 'inventory.manage', 'inventory.export', 'cskh.manage_orders'] },
  { prefix: '/schedule', any: ['schedule.view', 'schedule.register', 'schedule.approve', 'schedule.manage', 'payroll.view', 'payroll.manage', 'payroll.export'] },
  { prefix: '/live', any: ['live.view', 'live.manage', 'live.control', 'live.script'] },
  { prefix: '/equipment', any: '*' },
];

export function permsFor(role: string | null | undefined, config?: RbacConfig | null): string[] {
  if (!role || role === 'GUEST') return [];
  if (FULL_ACCESS.includes(role)) return ['*'];
  return config?.[role] ?? DEFAULT_PERMISSIONS[role] ?? [];
}

export function hasAny(perms: string[], need: string | string[]) {
  if (need === '*' || perms.includes('*')) return true;
  return (Array.isArray(need) ? need : [need]).some((p) => perms.includes(p));
}

/** Vai trò + quyền có được mở trang này không */
export function canAccessPath(pathname: string, role: string | null | undefined, perms: string[]) {
  const rule = PAGE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
  if (!rule) return true;
  if (rule.roles) return !!role && rule.roles.includes(role);
  if (rule.any === '*') return true;
  return hasAny(perms, rule.any);
}

// Cấu hình tải 1 lần mỗi lần mở trang, dùng chung giữa các component
let cache: Promise<RbacConfig | null> | null = null;
export function loadRbac(force = false): Promise<RbacConfig | null> {
  if (!cache || force) {
    cache = fetch('/api/rbac', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.config as RbacConfig) ?? null)
      .catch(() => null);
  }
  return cache;
}

/** { config, ready } — ready=false lúc đang tải (chưa chặn trang vội) */
export function useRbac(enabled = true) {
  const [state, setState] = useState<{ config: RbacConfig | null; ready: boolean }>({ config: null, ready: false });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadRbac().then((config) => alive && setState({ config, ready: true }));
    return () => { alive = false; };
  }, [enabled]);
  return state;
}
