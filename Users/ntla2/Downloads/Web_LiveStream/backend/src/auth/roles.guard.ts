import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Allow if no specific roles are required (or handle authentication elsewhere)
    if (!requiredRoles) {
      return true; 
    }

    const request = context.switchToHttp().getRequest();
    
    // Standard implementation: 
    // const user = request.user;
    // For now, we simulate extraction from a custom header for frontend-backend sync
    const userRole = request.headers['x-user-role'] || 'GUEST';

    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return true; // Admin bypasses everything
    }

    if (!requiredRoles.includes(userRole)) {
      throw new UnauthorizedException('Bạn không có quyền thực hiện thao tác này!');
    }

    return true;
  }
}
