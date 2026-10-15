import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservasService } from '../../../src/modules/reservas/reservas.service';
import { PrismaService } from '../../../src/infraestrutura/banco-dados/prisma.service';

describe('ReservasService', () => {
  let service: ReservasService;
  let tx: {
    usuario: { findUnique: jest.Mock };
    $queryRaw: jest.Mock;
    reserva: {
      updateMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  const agora = new Date('2026-10-15T04:00:00Z');
  const reserva = {
    id: 'reserva',
    usuarioId: 'usuario',
    pontoRecargaId: 'ponto',
    status: 'ATIVA',
    expiraEm: new Date(agora.getTime() + 3600000),
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(agora);
    tx = {
      usuario: { findUnique: jest.fn().mockResolvedValue({ id: 'usuario' }) },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ id: 'ponto', status: 'DISPONIVEL' }]),
      reserva: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(reserva),
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...reserva, status: 'CANCELADA' }),
      },
    };
    service = new ReservasService({
      $transaction: async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      reserva: tx.reserva,
    } as unknown as PrismaService);
  });
  afterEach(() => jest.useRealTimers());

  it('cria uma reserva de 60 minutos com a identidade autenticada', async () => {
    await expect(service.criar('usuario', 'ponto')).resolves.toEqual(reserva);
    expect(tx.reserva.create).toHaveBeenCalledWith({
      data: {
        usuarioId: 'usuario',
        pontoRecargaId: 'ponto',
        expiraEm: new Date(agora.getTime() + 3600000),
      },
    });
    expect(tx.$queryRaw.mock.calls[0][0].join('')).toContain('FOR UPDATE');
  });
  it('rejeita uma conta removida mesmo com JWT assinado', async () => {
    tx.usuario.findUnique.mockResolvedValue(null);
    await expect(service.criar('usuario', 'ponto')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tx.reserva.create).not.toHaveBeenCalled();
  });
  it('retorna 404 para ponto inexistente', async () => {
    tx.$queryRaw.mockResolvedValue([]);
    await expect(service.criar('usuario', 'ponto')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('rejeita um ponto fisicamente ocupado', async () => {
    tx.$queryRaw.mockResolvedValue([{ id: 'ponto', status: 'OCUPADO' }]);
    await expect(service.criar('usuario', 'ponto')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.reserva.create).not.toHaveBeenCalled();
  });
  it('rejeita outra reserva ativa no mesmo ponto', async () => {
    tx.reserva.findFirst.mockResolvedValue(reserva);
    await expect(service.criar('usuario', 'ponto')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.reserva.create).not.toHaveBeenCalled();
  });
  it('expira reservas antigas do ponto antes de criar uma nova', async () => {
    await service.criar('usuario', 'ponto');
    expect(tx.reserva.updateMany).toHaveBeenCalledWith({
      where: {
        pontoRecargaId: 'ponto',
        status: 'ATIVA',
        expiraEm: { lte: agora },
      },
      data: { status: 'EXPIRADA' },
    });
  });
  it('lista somente o próprio histórico e apresenta prazo vencido como EXPIRADA', async () => {
    tx.reserva.findMany.mockResolvedValue([
      { ...reserva, expiraEm: agora },
      reserva,
      { ...reserva, status: 'CANCELADA' },
    ]);
    const result = await service.listar('usuario');
    expect(tx.reserva.findMany.mock.calls[0][0].where).toEqual({
      usuarioId: 'usuario',
    });
    expect(result.map((r) => r.status)).toEqual([
      'EXPIRADA',
      'ATIVA',
      'CANCELADA',
    ]);
  });
  it('oculta reserva inexistente ou pertencente a outro usuário', async () => {
    await expect(service.cancelar('outro', 'reserva')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tx.reserva.findFirst).toHaveBeenCalledWith({
      where: { id: 'reserva', usuarioId: 'outro' },
    });
    expect(tx.reserva.updateMany).not.toHaveBeenCalled();
  });
  it.each(['CANCELADA', 'EXPIRADA'])(
    'rejeita cancelamento de reserva %s',
    async (status) => {
      tx.reserva.findFirst.mockResolvedValue({ ...reserva, status });
      await expect(
        service.cancelar('usuario', 'reserva'),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );
  it('rejeita cancelamento no instante de expiração', async () => {
    tx.reserva.findFirst.mockResolvedValue({ ...reserva, expiraEm: agora });
    await expect(service.cancelar('usuario', 'reserva')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('cancela somente uma reserva ativa do próprio usuário', async () => {
    tx.reserva.findFirst.mockResolvedValue(reserva);
    await expect(service.cancelar('usuario', 'reserva')).resolves.toMatchObject(
      { status: 'CANCELADA' },
    );
    expect(tx.reserva.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'reserva',
        usuarioId: 'usuario',
        status: 'ATIVA',
        expiraEm: { gt: agora },
      },
      data: { status: 'CANCELADA', canceladaEm: agora },
    });
  });
  it('rejeita uma segunda tentativa concorrente de cancelamento', async () => {
    tx.reserva.findFirst.mockResolvedValue(reserva);
    tx.reserva.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.cancelar('usuario', 'reserva')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
