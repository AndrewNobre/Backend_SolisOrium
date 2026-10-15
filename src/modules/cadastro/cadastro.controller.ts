import { Body, Controller, Post } from '@nestjs/common';
import { CadastroService } from './cadastro.service';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';

/** Expõe o cadastro público de contas na rota de usuários. */
@Controller('usuarios')
export class CadastroController {
  constructor(private readonly cadastroService: CadastroService) {}

  /** Valida os dados recebidos e solicita a criação da conta. */
  @Post()
  cadastrar(@Body() dto: CadastrarUsuarioDto) {
    return this.cadastroService.cadastrar(dto);
  }
}
