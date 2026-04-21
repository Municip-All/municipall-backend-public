import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../modules/user/user.services';
import { User } from '../../modules/user/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    // Encryption to be implemented by colleague. Using direct comparison for now.
    if (user && user.password === pass) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  }

  async signup(userData: Partial<User>) {
    const user = await this.userService.create({
      ...userData,
      role: 'Citoyen', // Default role for public signup
    });
    return this.login(user);
  }

  async getMe(userId: number): Promise<User | null> {
    return this.userService.findById(userId);
  }
}
