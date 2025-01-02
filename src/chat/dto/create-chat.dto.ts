import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    example: 'Let me know when you are ready to order',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: 89,
  })
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
