import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infraestrutura/banco-dados/prisma.service';
import { EmailService } from '../../src/infraestrutura/email/email.service';

describe('Login e cadastro HTTP', () => {
  let app: INestApplication;
  const jwt = new JwtService({ secret: 'segredo-exclusivo-dos-testes' });
  const id = '94e27936-592e-4a06-8fa3-4fc4c3825443';
  const dados = {
    nome: 'Motorista',
    email: 'motorista@example.com',
    senha: 'SenhaDeTeste123',
    telefone: '92999999999',
  };
  const usuarioPublico = {
    id,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
  };
  let usuario: typeof usuarioPublico & { senha: string };
  const prisma = {
    usuario: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tokenRecuperacaoSenha: { findUnique: jest.fn() },
    pontoRecarga: { findMany: jest.fn() },
    reserva: { findMany: jest.fn() },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(EmailService)
      .useValue({ enviarRecuperacaoSenha: jest.fn() })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  beforeEach(async () => {
    jest.resetAllMocks();
    usuario = { ...usuarioPublico, senha: await bcrypt.hash(dados.senha, 10) };
    prisma.usuario.create.mockImplementation(
      async ({ data }: { data: typeof usuario }) => {
        usuario = { ...data, id };
        return usuarioPublico;
      },
    );
    prisma.usuario.findUnique.mockImplementation(async () => usuario);
    prisma.usuario.findMany.mockResolvedValue([usuarioPublico]);
    prisma.usuario.update.mockResolvedValue({
      ...usuarioPublico,
      nome: 'Novo nome',
    });
    prisma.usuario.delete.mockResolvedValue(usuarioPublico);
    prisma.tokenRecuperacaoSenha.findUnique.mockResolvedValue(null);
    prisma.pontoRecarga.findMany.mockResolvedValue([]);
    prisma.reserva.findMany.mockResolvedValue([]);
  });
  afterAll(async () => {
    await app.close();
  });

  it('cadastra em POST /usuarios, autentica em POST /auth/login e acessa a rota protegida', async () => {
    const cadastro = await request(app.getHttpServer())
      .post('/usuarios')
      .send(dados)
      .expect(201);
    expect(cadastro.body).toEqual(usuarioPublico);
    expect(cadastro.body).not.toHaveProperty('senha');
    expect(usuario.senha).not.toBe(dados.senha);
    expect(await bcrypt.compare(dados.senha, usuario.senha)).toBe(true);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: dados.email, senha: dados.senha })
      .expect(201);
    expect(login.body.usuario).toEqual(usuarioPublico);
    expect(jwt.verify(login.body.access_token)).toMatchObject({
      sub: id,
      email: dados.email,
    });
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200, [usuarioPublico]);
    const auth = `Bearer ${login.body.access_token}`;
    await request(app.getHttpServer())
      .get('/pontos-recarga')
      .set('Authorization', auth)
      .expect(200, []);
    await request(app.getHttpServer())
      .get('/reservas')
      .set('Authorization', auth)
      .expect(200, []);
  });

  it('mantém 409 para e-mail ou telefone duplicado no cadastro', async () => {
    prisma.usuario.create.mockRejectedValue(
      new Error('Unique constraint failed'),
    );
    await request(app.getHttpServer())
      .post('/usuarios')
      .send(dados)
      .expect(409);
  });
  it.each([
    { ...dados, email: 'invalido' },
    { ...dados, senha: 'curta' },
    { ...dados, telefone: 'abc' },
    { ...dados, campoExtra: true },
  ])('mantém validação do cadastro: %j', async (body) => {
    await request(app.getHttpServer()).post('/usuarios').send(body).expect(400);
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });
  it('mantém 401 para senha incorreta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: dados.email, senha: 'incorreta' })
      .expect(401);
  });
  it('mantém 401 para conta inexistente', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: dados.email, senha: dados.senha })
      .expect(401);
  });
  it('mantém listagem de usuários protegida', async () => {
    await request(app.getHttpServer()).get('/usuarios').expect(401);
    expect(prisma.usuario.findMany).not.toHaveBeenCalled();
  });
  it('preserva consulta, atualização e remoção de usuários nas rotas existentes', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuarioPublico);
    await request(app.getHttpServer())
      .get(`/usuarios/${id}`)
      .expect(200, usuarioPublico);
    await request(app.getHttpServer())
      .patch(`/usuarios/${id}`)
      .send({ nome: 'Novo nome' })
      .expect(200, { ...usuarioPublico, nome: 'Novo nome' });
    await request(app.getHttpServer())
      .delete(`/usuarios/${id}`)
      .expect(200, usuarioPublico);
  });
  it('preserva a rota de solicitação de recuperação de senha', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/auth/recuperar-senha')
      .send({ email: dados.email })
      .expect(201, {
        message:
          'Se existir uma conta com este e-mail, as instruções de recuperação serão enviadas.',
      });
  });
  it('preserva a rota de redefinição e rejeita token inexistente', async () => {
    await request(app.getHttpServer())
      .post('/auth/redefinir-senha')
      .send({ token: 'inexistente', novaSenha: 'OutraSenha123' })
      .expect(400);
    expect(prisma.tokenRecuperacaoSenha.findUnique).toHaveBeenCalled();
  });
  it('preserva a proteção dos módulos de reservas e pontos de recarga', async () => {
    await request(app.getHttpServer()).get('/reservas').expect(401);
    await request(app.getHttpServer()).get('/pontos-recarga').expect(401);
  });
});
