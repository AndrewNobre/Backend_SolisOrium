import { IsUUID } from 'class-validator';

export class CriarReservaDto {
  @IsUUID()
  pontoRecargaId: string;
}
