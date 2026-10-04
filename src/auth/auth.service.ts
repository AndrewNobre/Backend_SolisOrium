import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly JwtService: JwtService) { }

    async buscarPorEmail(email: string) {
        return this.prisma.usuario.findUnique({
            where: { email },
        });
    }
    async validarSenha(senha: string, senhaHash: string) {
        return bcrypt.compare(senha, senhaHash);
    }
    async login(email: string, senha: string) {
        const usuario = await this.buscarPorEmail(email);

        if (!usuario) {
            return null;
        }

        const senhaValida = await this.validarSenha(senha, usuario.senha);

        if (!senhaValida) {
            return null;
        }

        const token = this.JwtService.sign({
            sub: usuario.id,
            email: usuario.email,
        });

        return {
            acess_token: token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
            }

        };
    }
}
