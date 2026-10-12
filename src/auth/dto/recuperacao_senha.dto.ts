import { IsEmail } from 'class-validator';

// Dados necessários para iniciar a recuperação de senha.
export class SolicitarRecuperacaoSenhaDto {
    @IsEmail()
    email: string;
}