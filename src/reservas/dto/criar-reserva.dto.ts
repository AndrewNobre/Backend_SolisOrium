import { IsUUID } from 'class-validator';

/** Valida o identificador do ponto informado na criação da reserva. */
export class CriarReservaDto {
  @IsUUID()
  pontoRecargaId: string;
}
