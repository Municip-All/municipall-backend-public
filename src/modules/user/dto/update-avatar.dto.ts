import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/** HTTP(S) URL or inline image from the backoffice / mobile clients. */
const AVATAR_URL_PATTERN =
  /^(https?:\/\/[^\s]+|data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+)$/i;

export class UpdateAvatarDto {
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Public image URL or base64 data URL (data:image/...;base64,...)',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(3_000_000)
  @Matches(AVATAR_URL_PATTERN, {
    message: 'avatarUrl must be an http(s) URL or a base64 image data URL',
  })
  avatarUrl!: string;
}
