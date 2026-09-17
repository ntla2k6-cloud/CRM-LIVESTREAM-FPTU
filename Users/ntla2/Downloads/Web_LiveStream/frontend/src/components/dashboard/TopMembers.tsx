import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const members = [
  { rank: 1, name: "Nguyễn Thị Tâm Đan", role: "Manager", count: 9, completed: 2, initials: "NĐ" },
  { rank: 2, name: "Hồ Thị Lan Anh", role: "Manager", count: 8, completed: 1, initials: "HA", avatar: true }
];

export function TopMembers() {
  return (
    <div className="w-full md:w-96">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Thành Viên Năng Nổ (Top PIC) <Trophy className="h-4 w-4 text-orange-500" />
        </h2>
        <p className="text-sm text-muted-foreground">Xếp hạng thành viên tham gia nhiều vị trí sản xuất nhất trong tháng</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {members.map((member, idx) => (
            <div key={idx} className="flex items-center p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mr-4">
                {member.rank}
              </div>
              <Avatar className="h-10 w-10 mr-3">
                {member.avatar ? (
                  <AvatarImage src="/placeholder.svg" alt={member.name} />
                ) : null}
                <AvatarFallback className="bg-slate-200">{member.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{member.name}</h3>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{member.count} lượt</div>
                <div className="text-xs text-emerald-600 font-medium">{member.completed} hoàn thành</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
