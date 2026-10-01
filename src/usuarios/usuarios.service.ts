import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'
import { CriarUsuarioDto } from './dto/criar-usuario';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarUsuarioDto) {
        const senhaHash = await bcrypt.hash(dto.senha, 10);

        return this.prisma.usuario.create({
            data: {
                nome: dto.nome,
                email: dto.email,
                senha: senhaHash,
            },
        });
    }
}
