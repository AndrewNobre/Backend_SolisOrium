import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from '../../../src/modules/usuarios/usuarios.service';
import { PrismaService } from '../../../src/infraestrutura/banco-dados/prisma.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
