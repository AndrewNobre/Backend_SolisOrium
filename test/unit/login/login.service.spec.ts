import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from '../../../src/modules/login/login.service';
import { PrismaService } from '../../../src/infraestrutura/banco-dados/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../../src/infraestrutura/email/email.service';

describe('LoginService', () => {
  let service: LoginService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {
            enviarRecuperacaoSenha: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
