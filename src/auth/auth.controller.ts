import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: SignupDto) {
    const { email, password, first_name, last_name, role } = createUserDto;
    const user = await this.authService.findByEmail(email);
    if (user) throw new ConflictException('Email already exists');

    const hashedPassword = await this.authService.hashPassword(password);

    await this.authService.signup({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role,
    });

    return {};
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.authService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValidPassword = await this.authService.comparePassword(
      password,
      user.password,
    );
    if (!isValidPassword)
      throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.authService.generateUserToken(
      user.id,
      user.role,
    );

    return { accessToken };
  }
}
