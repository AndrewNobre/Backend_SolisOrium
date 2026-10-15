import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

// Dados definidos ao cadastrar fisicamente um ponto de recarga.
// Status e localização detectada são atualizados apenas pela integração IoT.
export class CriarPontoRecargaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endereco: string;

  @IsLatitude()
  latitudeCadastrada: number;

  @IsLongitude()
  longitudeCadastrada: number;
}
