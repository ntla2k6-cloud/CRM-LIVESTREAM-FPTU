import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Calculator, BadgeDollarSign, TrendingUp } from "lucide-react";

export function MetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Content<br/>T9/2026</CardTitle>
          <div className="bg-blue-100 p-2 rounded-md">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">14</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600 font-medium">4 đã đăng</span> • 0 đang làm
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Video Chờ Duyệt<br/>&nbsp;</CardTitle>
          <div className="bg-orange-100 p-2 rounded-md">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Đang chờ Quản lý kiểm tra & xuất bản
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ước Tính Nghiệm Thu<br/>T9</CardTitle>
          <div className="bg-cyan-100 p-2 rounded-md">
            <Calculator className="h-4 w-4 text-cyan-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-600">5.440.000 đ</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Tổng ngân sách định mức theo Rate Card
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ước Tính Thù Lao PIC<br/>T9</CardTitle>
          <div className="bg-emerald-100 p-2 rounded-md">
            <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">5.440.002 đ</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Tổng thù lao chi trả CTV & thành viên
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ Lệ Đúng Hạn<br/>&nbsp;</CardTitle>
          <div className="bg-purple-100 p-2 rounded-md">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">25%</div>
          <p className="text-xs text-red-500 font-medium mt-1">
            ⚠️ 9 video trễ hạn
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
