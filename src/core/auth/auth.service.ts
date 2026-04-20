import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export interface UserAuth {
  userId: string;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(payload: JwtPayload): UserAuth {
    // Logic to validate user from payload (e.g., check database)
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }

  login(user: UserAuth) {
    const payload: JwtPayload = { username: user.username, sub: user.userId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
