import {
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

// Dados necessários para definir uma nova senha com um token válido.
export class RedefinirSenhaDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8)
    novaSenha: string;
}