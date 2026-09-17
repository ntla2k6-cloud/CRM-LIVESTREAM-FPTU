import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LIVE FPTU HCM",
  description: "Hệ thống quản lý Livestream All-in-one của Đại học FPT TP.HCM",
  icons: {
    icon: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`antialiased font-sans bg-slate-50 text-slate-800 overflow-hidden flex h-screen selection:bg-[#F58220] selection:text-white ${inter.className}`}>
        <AuthProvider>
          <Sidebar sidebarOpen={true} />
          <main className="flex-1 min-w-0 h-screen overflow-hidden pb-16 md:pb-0">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
