import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailModule } from '../../infraestrutura/email/email.module';

/** Registra login, recuperação de senha e validação de tokens JWT. */
@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    EmailModule,
  ],
  providers: [LoginService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
  controllers: [LoginController],
})
export class LoginModule {}
