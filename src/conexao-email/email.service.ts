import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

// Serviço responsável pelo envio de e-mails do sistema.
@Injectable()
export class EmailService {
    private readonly transporter: Transporter;
    private readonly remetente: string;

    constructor() {
        const usuarioGmail = process.env.GMAIL_USER;
        const senhaAppGmail = process.env.GMAIL_APP_PASSWORD;

        if (!usuarioGmail || !senhaAppGmail) {
            throw new Error(
                'As variáveis GMAIL_USER e GMAIL_APP_PASSWORD são obrigatórias.',
            );
        }

        this.remetente = usuarioGmail;

        this.transporter = createTransport({
            service: 'gmail',
            auth: {
                user: usuarioGmail,
                pass: senhaAppGmail,
            },
        });
    }

    // Envia o token necessário para a redefinição de senha.
    async enviarRecuperacaoSenha(destinatario: string, token: string) {
        try {
            await this.transporter.sendMail({
                from: `"SolisOrium" <${this.remetente}>`,
                to: destinatario,
                subject: 'Recuperação de senha - SolisOrium',
                text: `Use este código para redefinir sua senha: ${token}. Ele expira em 15 minutos.`,
                html: `
          <p>Você solicitou a recuperação de senha da sua conta SolisOrium.</p>
          <p>Use o código abaixo para definir uma nova senha:</p>
          <p><strong>${token}</strong></p>
          <p>Este código expira em 15 minutos e só pode ser usado uma vez.</p>
          <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        `,
            });
        } catch {
            throw new InternalServerErrorException(
                'Não foi possível enviar o e-mail de recuperação.',
            );
        }
    }
}