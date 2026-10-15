import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StatusPontoRecarga, StatusReserva } from '../generated/prisma/client';

const VALIDADE_RESERVA_MS = 15 * 60 * 1000;

/** Gerencia reservas, prazos e transições de estado no banco. */
@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria uma reserva de 15 minutos com bloqueio transacional por ponto. */
  async criar(usuarioId: string, pontoRecargaId: string) {
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true },
      });
      if (!usuario) throw new UnauthorizedException('Usuário não encontrado.');

      const [ponto] = await tx.$queryRaw<
        { id: string; status: StatusPontoRecarga }[]
      >`
        SELECT "id", "status" FROM "PontoRecarga" WHERE "id" = ${pontoRecargaId} FOR UPDATE
      `;
      if (!ponto)
        throw new NotFoundException('Ponto de recarga não encontrado.');
      if (ponto.status !== StatusPontoRecarga.DISPONIVEL) {
        throw new ConflictException('Ponto de recarga ocupado.');
      }

      const agora = new Date();
      await tx.reserva.updateMany({
        where: {
          pontoRecargaId,
          status: StatusReserva.ATIVA,
          expiraEm: { lte: agora },
        },
        data: { status: StatusReserva.EXPIRADA },
      });
      const existente = await tx.reserva.findFirst({
        where: { pontoRecargaId, status: StatusReserva.ATIVA },
        select: { id: true },
      });
      if (existente)
        throw new ConflictException('Ponto de recarga já reservado.');

      return tx.reserva.create({
        data: {
          usuarioId,
          pontoRecargaId,
          expiraEm: new Date(agora.getTime() + VALIDADE_RESERVA_MS),
        },
      });
    });
  }

  /** Retorna o histórico do usuário com o estado calculado pelo prazo de expiração. */
  async listar(usuarioId: string) {
    const agora = new Date();
    const reservas = await this.prisma.reserva.findMany({
      where: { usuarioId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return reservas.map((reserva) => ({
      ...reserva,
      status:
        reserva.status === StatusReserva.ATIVA && reserva.expiraEm <= agora
          ? StatusReserva.EXPIRADA
          : reserva.status,
    }));
  }

  /** Cancela uma reserva vigente do titular por atualização condicional. */
  async cancelar(usuarioId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findFirst({ where: { id, usuarioId } });
      if (!reserva) throw new NotFoundException('Reserva não encontrada.');

      const agora = new Date();
      if (reserva.status !== StatusReserva.ATIVA || reserva.expiraEm <= agora) {
        throw new ConflictException(
          'Somente reservas ativas e dentro do prazo podem ser canceladas.',
        );
      }
      const resultado = await tx.reserva.updateMany({
        where: {
          id,
          usuarioId,
          status: StatusReserva.ATIVA,
          expiraEm: { gt: agora },
        },
        data: { status: StatusReserva.CANCELADA, canceladaEm: agora },
      });
      if (resultado.count !== 1)
        throw new ConflictException('Reserva não está mais ativa.');
      return tx.reserva.findUniqueOrThrow({ where: { id } });
    });
  }
}
