import { ForbiddenException, Injectable } from '@nestjs/common';
import { isBackofficeRole, getPermissionsForRole } from './permissions';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../modules/user/user.service';
import { UserRepository } from '../../modules/user/user.repository';
import { User } from '../../modules/user/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  cityId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private userRepository: UserRepository,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    // Encryption to be implemented by colleague. Using direct comparison for now.
    if (user && user.password === pass) {
      return user;
    }
    return null;
  }

  async login(user: User, options?: { backofficeOnly?: boolean }) {
    if (options?.backofficeOnly && !isBackofficeRole(user.role)) {
      throw new ForbiddenException('Accès réservé aux comptes mairie (maire, assistant ou agent).');
    }

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      cityId: user.cityId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        avatar_url: user.avatar_url,
        cityId: user.cityId,
        permissions: getPermissionsForRole(user.role),
      },
    };
  }

  async signup(userData: Partial<User>) {
    const user = await this.userRepository.CreateUser({
      ...userData,
      role: 'Citoyen', // Default role for public signup
    });
    return this.login(user);
  }

  async getMe(userId: number): Promise<User | null> {
    return this.userService.findById(userId);
  }
}
