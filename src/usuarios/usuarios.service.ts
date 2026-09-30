import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'
import { CriarUsuarioDto } from './dto/criar-usuario';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarUsuarioDto) {
        return this.prisma.usuario.create({
            data: dto,
        });
    }
}
