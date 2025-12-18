import { CanActivate, ExecutionContext } from '@nestjs/common';

export class FakeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    req.user = {
      userId: 'test-user',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'operator',
    };

    return true;
  }
}