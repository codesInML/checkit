import {
  IsEnum,
  IsEmail,
  MinLength,
  Matches,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Prisma, Role } from '@prisma/client';

export class SignupDto implements Prisma.UserCreateInput {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}
