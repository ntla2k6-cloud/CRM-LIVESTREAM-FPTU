import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Video, Scissors, Eye, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const stages = [
  {
    step: 1,
    name: "Lên ý tưởng",
    count: 10,
    percentage: 71,
    icon: Lightbulb,
    colorClass: "bg-slate-100",
    textClass: "text-slate-700",
    iconClass: "text-slate-500",
    progressClass: "bg-slate-800",
  },
  {
    step: 2,
    name: "Đang sản xuất",
    count: 0,
    percentage: 0,
    icon: Video,
    colorClass: "bg-blue-50",
    textClass: "text-blue-700",
    iconClass: "text-blue-500",
    progressClass: "bg-blue-600",
  },
  {
    step: 3,
    name: "Đang dựng",
    count: 0,
    percentage: 0,
    icon: Scissors,
    colorClass: "bg-purple-50",
    textClass: "text-purple-700",
    iconClass: "text-purple-500",
    progressClass: "bg-purple-600",
  },
  {
    step: 4,
    name: "Chờ duyệt",
    count: 0,
    percentage: 0,
    icon: Eye,
    colorClass: "bg-orange-50",
    textClass: "text-orange-700",
    iconClass: "text-orange-500",
    progressClass: "bg-orange-600",
  },
  {
    step: 5,
    name: "Đã đăng",
    count: 4,
    percentage: 29,
    icon: CheckCircle2,
    colorClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    iconClass: "text-emerald-500",
    progressClass: "bg-emerald-600",
  }
];

export function Pipeline() {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Tiến Độ Quy Trình Sản Xuất (Pipeline)</h2>
        <p className="text-sm text-muted-foreground">Phân bổ 14 video qua 5 giai đoạn vòng đời sản xuất</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage, idx) => (
          <Card key={idx} className={cn("border-none shadow-sm", stage.colorClass)}>
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className={cn("text-xs font-semibold", stage.textClass)}>Bước {stage.step}</div>
                  <stage.icon className={cn("h-4 w-4", stage.iconClass)} />
                </div>
                <div className={cn("font-medium text-sm mb-4", stage.textClass)}>{stage.name}</div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-2xl font-bold">{stage.count}</div>
                  <div className="text-xs font-medium text-slate-500">{stage.percentage}%</div>
                </div>
                <Progress 
                  value={stage.percentage} 
                  className="h-1 bg-white/50" 
                  indicatorClassName={stage.progressClass} 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
