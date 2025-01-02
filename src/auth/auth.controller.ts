import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Ip,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from 'src/logger/logger.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private readonly logger = new LoggerService(AuthController.name);

  @Post('signup')
  @ApiOperation({ summary: 'Signup a user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created.',
  })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async signup(@Body() signupDto: SignupDto, @Ip() ip: string) {
    const { email, password, first_name, last_name, role } = signupDto;
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

    this.logger.log(
      `User with email ${email} signed up\t${ip}`,
      AuthController.name,
    );

    return {};
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
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

    this.logger.log(
      `User with email ${email} logged in\t${ip}`,
      AuthController.name,
    );
    return { accessToken, role: user.role };
  }
}
