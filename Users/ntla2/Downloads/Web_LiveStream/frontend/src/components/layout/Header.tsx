import React from 'react';
import { Search, Sun, Settings, PanelLeftClose } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <PanelLeftClose className="h-5 w-5" />
        </Button>
        <div className="font-semibold text-lg hidden md:block">TikTok Portal</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="w-64 rounded-full bg-slate-100 pl-8 h-9 border-none focus-visible:ring-1 focus-visible:ring-slate-300"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Sun className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" alt="Avatar" />
          <AvatarFallback className="bg-indigo-600 text-white text-xs">P</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
