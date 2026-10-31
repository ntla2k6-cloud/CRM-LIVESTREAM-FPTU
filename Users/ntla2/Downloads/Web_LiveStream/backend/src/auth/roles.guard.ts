import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';

export function safeEqual(a: unknown, b: string | undefined): boolean {
  if (typeof a !== 'string' || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Ai được gọi backend:
 * - Proxy Next.js (`/api/backend/*`): gửi `x-internal-key` = INTERNAL_API_KEY và `x-user-role` lấy từ phiên đăng nhập.
 *   Chỉ khi khóa đúng mới tin `x-user-role` — gọi thẳng lên Render thì không giả role được.
 * - Extension Chrome: route có @ExtensionAccess, gửi `x-extension-token` = EXTENSION_TOKEN.
 * - Route @Public: ai cũng gọi được.
 * Chưa đặt INTERNAL_API_KEY / EXTENSION_TOKEN → chạy chế độ cũ (tin header) và log cảnh báo, để deploy không làm sập production.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  private warned = false;

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('isPublic', targets)) return true;

    const request = context.switchToHttp().getRequest();
    const headers = request.headers ?? {};
    const internalKey = process.env.INTERNAL_API_KEY;
    const extensionToken = process.env.EXTENSION_TOKEN;
    this.warnIfOpen(internalKey, extensionToken);

    if (this.reflector.getAllAndOverride<boolean>('extensionAccess', targets)) {
      if (!extensionToken || safeEqual(headers['x-extension-token'], extensionToken)) return true;
    }

    if (internalKey && !safeEqual(headers['x-internal-key'], internalKey)) {
      throw new UnauthorizedException('Thiếu hoặc sai khóa truy cập backend');
    }

    const userRole = typeof headers['x-user-role'] === 'string' ? headers['x-user-role'] : 'GUEST';
    if (userRole === 'GUEST') {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', targets);
    if (!requiredRoles || userRole === 'ADMIN' || userRole === 'MANAGER') return true;
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này!');
    }
    return true;
  }

  private warnIfOpen(internalKey?: string, extensionToken?: string) {
    if (this.warned) return;
    this.warned = true;
    if (!internalKey) this.logger.warn('INTERNAL_API_KEY chưa đặt — backend đang tin header x-user-role (ai cũng giả được)');
    if (!extensionToken) this.logger.warn('EXTENSION_TOKEN chưa đặt — API extension không cần token');
  }
}
