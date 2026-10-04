import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CriarUsuarioDto } from './dto/criar-usuario';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    criar(@Body() dto: CriarUsuarioDto) {
        return this.usuariosService.criar(dto);
    }
    @UseGuards(JwtAuthGuard)
    @Get()
    list() {
        return this.usuariosService.listar()
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