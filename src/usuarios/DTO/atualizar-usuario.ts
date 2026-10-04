import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class AtualizarUsuarioDto {
    @IsOptional()
    @IsString()
    nome?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d+$/)
    telefone?: string;
}