import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Req() req: AuthenticatedRequest, @Body() body: UpdateAvatarDto) {
    if (!body.avatarUrl) {
      throw new BadRequestException('Avatar URL is required');
    }
    return this.userService.updateAvatar(req.user.sub, body.avatarUrl);
  }

  @Post('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, body);
  }

  @Post('password')
  @ApiOperation({ summary: 'Update user password' })
  async updatePassword(@Req() req: AuthenticatedRequest, @Body() body: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.sub, body);
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get user stats' })
  async getStats(@Req() req: AuthenticatedRequest): Promise<any> {
    return this.userService.getStats(req.user.sub);
  }
}
