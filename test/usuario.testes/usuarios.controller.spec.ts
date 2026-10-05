import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from '../../src/usuarios/usuarios.controller';
import { UsuariosService } from '../../src/usuarios/usuarios.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth/jwt-auth.guard';

describe('UsuariosController', () => {
  let controller: UsuariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});