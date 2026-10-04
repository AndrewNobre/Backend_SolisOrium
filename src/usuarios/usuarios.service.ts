import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'
import { CriarUsuarioDto } from './dto/criar-usuario';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarUsuarioDto) {
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
