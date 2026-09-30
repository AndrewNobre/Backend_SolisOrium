import { Body, Controller, Post } from '@nestjs/common';
import { CriarUsuarioDto } from './dto/criar-usuario';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    criar(@Body() dto: CriarUsuarioDto) {
        return this.usuariosService.criar(dto);
    }
}