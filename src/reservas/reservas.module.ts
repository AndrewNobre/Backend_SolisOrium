import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

/** Registra o controller, o serviço e a dependência de autenticação das reservas. */
@Module({
  imports: [AuthModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
