import React from 'react';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clapperboard,
  BadgeDollarSign,
  ReceiptText,
  Wallet,
  Users,
  Medal,
  HardDrive,
  Database,
  History,
  MessageCircle,
  Palette,
  ChevronsUpDown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  {
    group: "Tổng quan",
    items: [
      { name: "Bảng điều khiển", icon: LayoutDashboard, isActive: true },
    ]
  },
  {
    group: "Vận hành",
    items: [
      { name: "Sản xuất Content", icon: Clapperboard, isActive: false },
      { name: "Thù lao của tôi", icon: BadgeDollarSign, isActive: false },
      { name: "Nghiệm thu & Chi phí", icon: ReceiptText, isActive: false },
      { name: "Quỹ team", icon: Wallet, isActive: false },
    ]
  },
  {
    group: "Quản trị",
    items: [
      { name: "Người dùng", icon: Users, isActive: false },
      { name: "Khen thưởng", icon: Medal, isActive: false },
      { name: "Google Drive", icon: HardDrive, isActive: false },
      { name: "Dữ liệu nền & Bảng giá", icon: Database, isActive: false },
      { name: "Nhật ký hoạt động", icon: History, isActive: false },
      { name: "Thông báo Zalo", icon: MessageCircle, isActive: false },
    ]
  },
  {
    group: "Khác",
    items: [
      { name: "Giao diện", icon: Palette, isActive: false },
    ]
  }
];

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="p-4 flex items-center gap-2">
        <div className="bg-orange-500 rounded p-1.5 flex items-center justify-center">
           {/* Placeholder for actual logo */}
           <span className="text-white font-bold text-lg leading-none">FPT</span>
        </div>
        <div>
          <h1 className="font-semibold text-sm">TikTok Portal</h1>
          <p className="text-xs text-muted-foreground">FPTU HCM</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          {menuItems.map((group, i) => (
            <div key={i} className="px-3 py-2">
              <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
                {group.group}
              </h2>
              <div className="space-y-1">
                {group.items.map((item, j) => (
                  <button
                    key={j}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors",
                      item.isActive ? "bg-orange-50 text-orange-600" : "text-slate-600"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t">
        <button className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 rounded-md transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg" alt="Avatar" />
            <AvatarFallback className="bg-indigo-600 text-white">A</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start flex-1 text-sm">
            <span className="font-semibold">Admin</span>
            <span className="text-xs text-muted-foreground">admin@fpt.edu.vn</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
