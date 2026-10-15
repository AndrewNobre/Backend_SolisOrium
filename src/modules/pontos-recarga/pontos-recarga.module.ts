import { Module } from '@nestjs/common';
import { PontosRecargaController } from './pontos-recarga.controller';
import { PontosRecargaService } from './pontos-recarga.service';
import { LoginModule } from '../login/login.module';

// Agrupa as rotas e regras de negócio dos pontos de recarga.
@Module({
  imports: [LoginModule],
  controllers: [PontosRecargaController],
  providers: [PontosRecargaService],
})
export class PontosRecargaModule {}
