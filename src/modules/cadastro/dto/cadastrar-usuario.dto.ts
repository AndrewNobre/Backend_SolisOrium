import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/** Valida os dados necessários para cadastrar uma conta. */
export class CadastrarUsuarioDto {
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
