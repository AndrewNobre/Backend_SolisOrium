import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module'
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { RecargaModule } from './pontos-recarga/recarga.module';

@Module({
  imports: [PrismaModule, UsuariosModule, AuthModule, RecargaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
