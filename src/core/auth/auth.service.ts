import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(payload: any): Promise<any> {
    // Logic to validate user from payload (e.g., check database)
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
