import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { EmailModule } from '../conexao-email/email.module';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, }), EmailModule],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
  controllers: [AuthController]
})
export class AuthModule { }

