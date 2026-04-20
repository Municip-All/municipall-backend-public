import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new citizen' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  async signup(@Body() userData: any) {
    return this.authService.signup(userData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    const user = await this.authService.getMe(req.user.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Remove sensitive data
    const { password, ...result } = user;
    return result;
  }
}
