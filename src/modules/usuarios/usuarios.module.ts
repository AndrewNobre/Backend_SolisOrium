import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { LoginModule } from '../login/login.module';

@Module({
  imports: [LoginModule],
  providers: [UsuariosService],
  controllers: [UsuariosController],
})
export class UsuariosModule {}
