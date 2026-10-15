import { Module } from '@nestjs/common';
import { LoginModule } from '../login/login.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

/** Registra o controller, o serviço e a dependência de autenticação das reservas. */
@Module({
  imports: [LoginModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
