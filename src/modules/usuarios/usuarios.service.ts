import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infraestrutura/banco-dados/prisma.service';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';

/** Consulta e mantém os dados de usuários já cadastrados. */
@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAT: true,
        updatedAt: true,
      },
    });
  }
  async buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAT: true,
        updatedAt: true,
      },
    });
  }
  async atualizar(id: string, dto: AtualizarUsuarioDto) {
    return this.prisma.usuario.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAT: true,
        updatedAt: true,
      },
    });
  }
  async remover(id: string) {
    return this.prisma.usuario.delete({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
      },
    });
  }
}
