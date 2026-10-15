import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { PrismaService } from '../../../src/infraestrutura/banco-dados/prisma.service';
import { ReservasService } from '../../../src/modules/reservas/reservas.service';

const connectionString = process.env.TEST_DATABASE_URL;
const integration = connectionString ? describe : describe.skip;

integration('Reservas PostgreSQL (integração)', () => {
  const schema = `test_reservas_${randomUUID().replaceAll('-', '')}`;
  let admin: Pool;
  let pool: Pool;
  let prisma: PrismaClient;
  let service: ReservasService;
  let usuarioId: string;
  let outroUsuarioId: string;
  let pontoRecargaId: string;

  beforeAll(async () => {
    admin = new Pool({ connectionString, max: 1 });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({
      connectionString,
      max: Number(process.env.TEST_POOL_MAX ?? 10),
      options: `-c search_path=${schema}`,
    });
    const migrations = join(process.cwd(), 'prisma/migrations');
    for (const migration of readdirSync(migrations, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      await pool.query(
        `SET search_path TO "${schema}";\n` +
          readFileSync(
            join(migrations, migration.name, 'migration.sql'),
            'utf8',
          ),
      );
    }
    prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
    service = new ReservasService(prisma as PrismaService);
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Teste',
        email: 'reserva@example.test',
        senha: 'hash-apenas-para-fixture',
        telefone: '111111111',
      },
    });
    const outro = await prisma.usuario.create({
      data: {
        nome: 'Outro',
        email: 'outro@example.test',
        senha: 'hash-apenas-para-fixture',
        telefone: '222222222',
      },
    });
    usuarioId = usuario.id;
    outroUsuarioId = outro.id;
  }, 30000);

  beforeEach(async () => {
    const ponto = await prisma.pontoRecarga.create({
      data: {
        nome: 'Ponto de teste',
        endereco: 'Endereço de teste',
        latitudeCadastrada: -3,
        longitudeCadastrada: -60,
      },
    });
    pontoRecargaId = ponto.id;
  });
  afterAll(async () => {
    await prisma?.$disconnect();
    await pool?.end();
    if (admin) {
      try {
        await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await admin.end();
      }
    }
  });

  it('permite apenas uma criação quando duas requisições disputam o mesmo ponto', async () => {
    const resultados = await Promise.allSettled([
      service.criar(usuarioId, pontoRecargaId),
      service.criar(outroUsuarioId, pontoRecargaId),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const falha = resultados.find(
      (r) => r.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(falha.reason).toBeInstanceOf(ConflictException);
    expect(
      await prisma.reserva.count({
        where: { pontoRecargaId, status: 'ATIVA' },
      }),
    ).toBe(1);
  });

  it('o índice do banco também impede duplicidade fora do serviço', async () => {
    await service.criar(usuarioId, pontoRecargaId);
    await expect(
      prisma.reserva.create({
        data: {
          usuarioId: outroUsuarioId,
          pontoRecargaId,
          expiraEm: new Date(Date.now() + 900000),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('substitui uma reserva vencida sem perder o histórico', async () => {
    const antiga = await service.criar(usuarioId, pontoRecargaId);
    await prisma.reserva.update({
      where: { id: antiga.id },
      data: { expiraEm: new Date(Date.now() - 1000) },
    });
    expect(await service.listar(usuarioId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: antiga.id, status: 'EXPIRADA' }),
      ]),
    );
    await service.criar(outroUsuarioId, pontoRecargaId);
    expect(
      await prisma.reserva.findUnique({ where: { id: antiga.id } }),
    ).toMatchObject({ status: 'EXPIRADA' });
    expect(await prisma.reserva.count({ where: { pontoRecargaId } })).toBe(2);
  });

  it('somente o titular pode cancelar e o cancelamento libera o ponto', async () => {
    const reserva = await service.criar(usuarioId, pontoRecargaId);
    await expect(
      service.cancelar(outroUsuarioId, reserva.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(await service.cancelar(usuarioId, reserva.id)).toMatchObject({
      status: 'CANCELADA',
      canceladaEm: expect.any(Date),
    });
    await expect(
      service.criar(outroUsuarioId, pontoRecargaId),
    ).resolves.toMatchObject({ status: 'ATIVA' });
  });

  it('duas tentativas simultâneas de cancelamento têm um único sucesso', async () => {
    const reserva = await service.criar(usuarioId, pontoRecargaId);
    const resultados = await Promise.allSettled([
      service.cancelar(usuarioId, reserva.id),
      service.cancelar(usuarioId, reserva.id),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult)
        .reason,
    ).toBeInstanceOf(ConflictException);
  });

  it('rejeita ponto ocupado e ponto inexistente', async () => {
    await prisma.pontoRecarga.update({
      where: { id: pontoRecargaId },
      data: { status: 'OCUPADO' },
    });
    await expect(
      service.criar(usuarioId, pontoRecargaId),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.criar(usuarioId, randomUUID())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
