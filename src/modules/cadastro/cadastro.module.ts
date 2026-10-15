import { Module } from '@nestjs/common';
import { CadastroController } from './cadastro.controller';
import { CadastroService } from './cadastro.service';

/** Registra os componentes responsáveis pelo cadastro de usuários. */
@Module({
  controllers: [CadastroController],
  providers: [CadastroService],
})
export class CadastroModule {}
