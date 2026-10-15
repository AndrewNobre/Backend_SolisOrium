import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infraestrutura/banco-dados/prisma.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { LoginModule } from './modules/login/login.module';
import { PontosRecargaModule } from './modules/pontos-recarga/pontos-recarga.module';
import { CadastroModule } from './modules/cadastro/cadastro.module';
import { ReservasModule } from './modules/reservas/reservas.module';

@Module({
  imports: [
    PrismaModule,
    CadastroModule,
    UsuariosModule,
    LoginModule,
    PontosRecargaModule,
    ReservasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
