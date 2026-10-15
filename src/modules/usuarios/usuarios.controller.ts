import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../login/guards/jwt-auth.guard';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuariosService } from './usuarios.service';

/** Expõe consulta, atualização e remoção de usuários cadastrados. */
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  listar() {
    return this.usuariosService.listar();
  }
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuariosService.buscarPorId(id);
  }
  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarUsuarioDto) {
    return this.usuariosService.atualizar(id, dto);
  }
  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.usuariosService.remover(id);
  }
}
