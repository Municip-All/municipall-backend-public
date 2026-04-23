import { Controller, Post, Body, UseGuards, Req, BadRequestException, Get, Query, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UserRepository } from './user.repository';
import { User } from './user.entity';

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
  constructor(private readonly userService: UserService, 
              private readonly userRepository: UserRepository,
  ) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Req() req: AuthenticatedRequest, @Body() body: UpdateAvatarDto) {
    if (!body.avatarUrl) {
      throw new BadRequestException('Avatar URL is required');
    }
    return this.userService.updateAvatar(req.user.sub, body.avatarUrl);
  }

  @Get('all_user')                                                                                                                                              
  @ApiOperation({ summary: 'get all the user' })
  async getUsers(): Promise<User[]> {
      return this.userRepository.findAll();                                                                                                                     
  }


  @Get('user_by_id')
  @ApiOperation({summary: 'get specific user'})
  async getUser(@Query('id') id: string): Promise<User>{
    const userID = Number(id);
    if(!Number.isFinite(userID)) throw new BadRequestException('id must be a number');
    const user = await this.userRepository.findById(userID);
    if(!user) throw new NotFoundException('User not NotFoundException')
    return user
  }

  

}