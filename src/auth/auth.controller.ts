import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() 
    body: { 
      userId: string; 
      companyId: string; 
      role: string 
    }) {
      if (process.env.NODE_ENV === 'test') {
        return {
          access_token: this.authService.signTestToken({
            userId: body.userId,
            companyId: body.companyId,
            role: body.role,
          }),
        };
      }
    return this.authService.login(body);
  }
}