import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { ReservasController } from '../../src/reservas/reservas.controller';
import { ReservasService } from '../../src/reservas/reservas.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth/jwt-auth.guard';

describe('Reservas HTTP', () => {
  let app: INestApplication;
  const jwt = new JwtService({ secret: 'segredo-exclusivo-dos-testes' });
  const usuarioId = '94e27936-592e-4a06-8fa3-4fc4c3825443';
  const pontoRecargaId = '0fc2cf04-5b2f-4e86-8703-4654359db181';
  const reservaId = 'b98c2b9c-cd0f-4503-bb53-d95cc70268df';
  const service = { criar: jest.fn(), listar: jest.fn(), cancelar: jest.fn() };
  const authorization = () => `Bearer ${jwt.sign({ sub: usuarioId })}`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReservasController],
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwt },
        { provide: ReservasService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    service.criar.mockResolvedValue({
      id: reservaId,
      usuarioId,
      pontoRecargaId,
      status: 'ATIVA',
    });
    service.listar.mockResolvedValue([]);
    service.cancelar.mockResolvedValue({ id: reservaId, status: 'CANCELADA' });
  });
  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['post', '/reservas'],
    ['get', '/reservas'],
    ['patch', `/reservas/${reservaId}/cancelar`],
  ])('exige JWT em %s %s', async (method, path) => {
    await request(app.getHttpServer())
      [method as 'post' | 'get' | 'patch'](path)
      .expect(401);
  });
  it('rejeita assinatura inválida', async () => {
    await request(app.getHttpServer())
      .get('/reservas')
      .set('Authorization', 'Bearer invalido')
      .expect(401);
  });
  it('rejeita JWT expirado', async () => {
    await request(app.getHttpServer())
      .get('/reservas')
      .set(
        'Authorization',
        `Bearer ${jwt.sign({ sub: usuarioId }, { expiresIn: -1 })}`,
      )
      .expect(401);
  });
  it('rejeita payload assinado sem identidade', async () => {
    await request(app.getHttpServer())
      .get('/reservas')
      .set('Authorization', `Bearer ${jwt.sign({})}`)
      .expect(401);
  });
  it('usa o sub do JWT ao criar a reserva', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', authorization())
      .send({ pontoRecargaId })
      .expect(201);
    expect(service.criar).toHaveBeenCalledWith(usuarioId, pontoRecargaId);
  });
  it('impede enviar usuarioId para reservar em nome de outra pessoa', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', authorization())
      .send({ pontoRecargaId, usuarioId: 'outro' })
      .expect(400);
    expect(service.criar).not.toHaveBeenCalled();
  });
  it.each([{}, { pontoRecargaId: 'invalido' }])(
    'valida o ponto informado: %j',
    async (body) => {
      await request(app.getHttpServer())
        .post('/reservas')
        .set('Authorization', authorization())
        .send(body)
        .expect(400);
    },
  );
  it('lista somente para a identidade autenticada', async () => {
    await request(app.getHttpServer())
      .get('/reservas')
      .set('Authorization', authorization())
      .expect(200, []);
    expect(service.listar).toHaveBeenCalledWith(usuarioId);
  });
  it('encaminha cancelamento com identidade e UUID da reserva', async () => {
    await request(app.getHttpServer())
      .patch(`/reservas/${reservaId}/cancelar`)
      .set('Authorization', authorization())
      .expect(200);
    expect(service.cancelar).toHaveBeenCalledWith(usuarioId, reservaId);
  });
  it('rejeita identificador inválido ao cancelar', async () => {
    await request(app.getHttpServer())
      .patch('/reservas/invalido/cancelar')
      .set('Authorization', authorization())
      .expect(400);
    expect(service.cancelar).not.toHaveBeenCalled();
  });
});
