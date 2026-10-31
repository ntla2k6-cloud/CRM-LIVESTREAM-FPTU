import { NextRequest, NextResponse } from 'next/server';

// Trang khách/thí sinh dùng không cần đăng nhập
const PUBLIC_PAGES = ['/login', '/claim', '/tracking'];

// next-auth dùng session lưu DB (PrismaAdapter) → middleware (Edge) không truy vấn DB được,
// chỉ chặn sớm khi chưa có cookie phiên. Kiểm tra quyền thật nằm ở proxy /api/backend + backend.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token');
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('callbackUrl', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Bỏ qua API route (tự xác thực), file tĩnh và ảnh
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.jpg|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
};
