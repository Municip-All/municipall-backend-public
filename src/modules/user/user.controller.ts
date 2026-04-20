import { Controller, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UserServices } from './user.services';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userServices: UserServices) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Req() req: any, @Body('avatarUrl') avatarUrl: string) {
    if (!avatarUrl) {
      throw new BadRequestException('Avatar URL is required');
    }
    return this.userServices.updateAvatar(req.user.sub, avatarUrl);
  }
}
