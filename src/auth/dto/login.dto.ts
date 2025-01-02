import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'ife@olubo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'somepassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
