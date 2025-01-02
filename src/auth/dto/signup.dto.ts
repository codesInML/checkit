import {
  IsEnum,
  IsEmail,
  MinLength,
  Matches,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Prisma, Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto implements Prisma.UserCreateInput {
  @ApiProperty({
    example: 'Ifeoluwa',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    example: 'Olubo',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    example: 'ife@olubo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'somepassword123',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  password: string;

  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    default: Role.CUSTOMER,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
