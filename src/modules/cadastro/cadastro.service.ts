import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infraestrutura/banco-dados/prisma.service';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import * as bcrypt from 'bcrypt';

/** Cadastra usuários e protege a senha antes da persistência. */
@Injectable()
export class CadastroService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria a conta com hash bcrypt e trata e-mail ou telefone duplicados. */
  async cadastrar(dto: CadastrarUsuarioDto) {
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    try {
      return await this.prisma.usuario.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: senhaHash,
          telefone: dto.telefone,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          createdAT: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint failed')
      ) {
        throw new ConflictException('Email ou telefone já cadastrado.');
      }

      throw error;
    }
  }
}
