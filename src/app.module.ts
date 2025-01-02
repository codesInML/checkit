import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { OrderModule } from './order/order.module';
import { ChatModule } from './chat/chat.module';
import { ChatGateWayModule } from './chat-gate-way/chat-gate-way.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 150,
      },
    ]),
    LoggerModule,
    OrderModule,
    ChatModule,
    ChatGateWayModule,
    ChatGateWayModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
