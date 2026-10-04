import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  telefone: string;
}