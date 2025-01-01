import { Role } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsInt()
  @IsNotEmpty()
  order_id: number;

  @IsInt()
  @IsOptional()
  user_id: number;

  @IsEnum(Role)
  @IsOptional()
  role: string;
}
