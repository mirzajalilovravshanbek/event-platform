import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {}

  login(user: { userId: string; companyId: string; role: string }) {
    const payload = {
      sub: user.userId,
      companyId: user.companyId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  signTestToken(payload: {
    userId: string;
    companyId: string;
    role: string;
  }) {
    return this.jwtService.sign(payload);
  }
}
