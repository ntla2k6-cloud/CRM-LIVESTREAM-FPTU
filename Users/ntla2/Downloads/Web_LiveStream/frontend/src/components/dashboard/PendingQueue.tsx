import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export function PendingQueue() {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Hàng Đợi Video Chờ Duyệt</h2>
          <p className="text-sm text-muted-foreground">Các video đã hoàn thành dựng, đang chờ Quản lý kiểm duyệt nội dung</p>
        </div>
        <button className="text-sm font-medium flex items-center hover:underline">
          Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>

      <Card className="h-64 flex items-center justify-center border-dashed bg-slate-50/50">
        <CardContent className="flex flex-col items-center text-center p-6">
          <div className="bg-emerald-100 p-3 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="font-medium">Không có video nào đang chờ duyệt!!</p>
          <p className="text-sm text-muted-foreground mt-1">Mọi công việc đã được xử lý đúng hạn.</p>
        </CardContent>
      </Card>
    </div>
  );
}
