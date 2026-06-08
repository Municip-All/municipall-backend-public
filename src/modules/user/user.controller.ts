import { Controller, Post, Get, Body, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';

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
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequirePermissions(Permission.PROFILE_WRITE)
  @Post('avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Req() req: AuthenticatedRequest, @Body() body: UpdateAvatarDto) {
    if (!body.avatarUrl) {
      throw new BadRequestException('Avatar URL is required');
    }
    return this.userService.updateAvatar(req.user.sub, body.avatarUrl);
  }

  @RequirePermissions(Permission.PROFILE_WRITE)
  @Post('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, body);
  }

  @RequirePermissions(Permission.PROFILE_WRITE)
  @Post('password')
  @ApiOperation({ summary: 'Update user password' })
  async updatePassword(@Req() req: AuthenticatedRequest, @Body() body: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.sub, body);
  }

  @RequirePermissions(Permission.PROFILE_READ)
  @Get('stats')
  @ApiOperation({ summary: 'Get user stats' })
  async getStats(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.userService.getStats(req.user.sub);
  }

  @RequirePermissions(Permission.PROFILE_READ)
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.userService.getNotificationPreferences(req.user.sub);
  }

  @RequirePermissions(Permission.PROFILE_WRITE)
  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(@Req() req: AuthenticatedRequest, @Body() body: UpdatePreferencesDto) {
    return this.userService.updateNotificationPreferences(req.user.sub, body);
  }

  @RequirePermissions(Permission.PROFILE_WRITE)
  @Post('push-token')
  @ApiOperation({ summary: 'Register Expo push token for mobile notifications' })
  async registerPushToken(@Req() req: AuthenticatedRequest, @Body() body: UpdatePushTokenDto) {
    return this.userService.updatePushToken(req.user.sub, body.expoPushToken);
  }
}
