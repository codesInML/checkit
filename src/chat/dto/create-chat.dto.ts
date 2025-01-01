import { Role } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsInt()
  @IsNotEmpty()
  order_id: number;

  @IsInt()
  user_id: number;

  @IsEnum(Role)
  role: string;
}
