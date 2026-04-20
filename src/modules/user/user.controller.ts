import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UserServices } from './user.services';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

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
  constructor(private readonly userServices: UserServices) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Req() req: AuthenticatedRequest, @Body() body: UpdateAvatarDto) {
    if (!body.avatarUrl) {
      throw new BadRequestException('Avatar URL is required');
    }
    return this.userServices.updateAvatar(req.user.sub, body.avatarUrl);
  }
}
