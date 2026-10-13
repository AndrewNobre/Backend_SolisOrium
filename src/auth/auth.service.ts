import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../conexao-email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly JwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

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
            throw new UnauthorizedException('E-mail ou senha inválidos.');
        }

        const senhaValida = await this.validarSenha(senha, usuario.senha);

        if (!senhaValida) {
            throw new UnauthorizedException('E-mail ou senha inválidos.');
        }

        const token = this.JwtService.sign({
            sub: usuario.id,
            email: usuario.email,
        });

        return {
            access_token: token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
            },
        };
    }

    // Gera um token temporário para a redefinição de senha.
    async solicitarRecuperacaoSenha(email: string) {
        const resposta = {
            message:
                'Se existir uma conta com este e-mail, as instruções de recuperação serão enviadas.',
        };

        const usuario = await this.buscarPorEmail(email);

        // A resposta é idêntica para impedir descoberta de e-mails cadastrados.
        if (!usuario) {
            return resposta;
        }

        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

        await this.prisma.$transaction([
            this.prisma.tokenRecuperacaoSenha.deleteMany({
                where: {
                    usuarioId: usuario.id,
                    usadoEm: null,
                },
            }),
            this.prisma.tokenRecuperacaoSenha.create({
                data: {
                    tokenHash,
                    expiraEm,
                    usuarioId: usuario.id,
                },
            }),
        ]);

        await this.emailService.enviarRecuperacaoSenha(
            usuario.email,
            token,
        );

        return resposta;
    }

    // Valida o token e registra a nova senha protegida por bcrypt.
    async redefinirSenha(token: string, novaSenha: string) {
        const tokenHash = createHash('sha256').update(token).digest('hex');

        const tokenRecuperacao =
            await this.prisma.tokenRecuperacaoSenha.findUnique({
                where: { tokenHash },
            });

        if (
            !tokenRecuperacao ||
            tokenRecuperacao.usadoEm ||
            tokenRecuperacao.expiraEm < new Date()
        ) {
            throw new BadRequestException('Token inválido ou expirado.');
        }

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        const agora = new Date();

        await this.prisma.$transaction(async (tx) => {
            const tokenUsado = await tx.tokenRecuperacaoSenha.updateMany({
                where: {
                    id: tokenRecuperacao.id,
                    usadoEm: null,
                },
                data: {
                    usadoEm: agora,
                },
            });

            if (tokenUsado.count !== 1) {
                throw new BadRequestException('Token inválido ou já utilizado.');
            }

            await tx.usuario.update({
                where: {
                    id: tokenRecuperacao.usuarioId,
                },
                data: {
                    senha: senhaHash,
                },
            });
        });

        return {
            message: 'Senha redefinida com sucesso.',
        };
    }
}