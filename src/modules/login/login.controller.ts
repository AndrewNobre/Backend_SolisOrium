import { Controller, Body, Post } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { SolicitarRecuperacaoSenhaDto } from './dto/solicitar-recuperacao-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';

/** Expõe login e recuperação de senha sob o contrato HTTP de autenticação. */
@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  /** Autentica as credenciais e retorna o token de acesso. */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginService.login(dto.email, dto.senha);
  }

  @Post('recuperar-senha')
  solicitarRecuperacaoSenha(@Body() dto: SolicitarRecuperacaoSenhaDto) {
    return this.loginService.solicitarRecuperacaoSenha(dto.email);
  }

  @Post('redefinir-senha')
  redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.loginService.redefinirSenha(dto.token, dto.novaSenha);
  }
}
