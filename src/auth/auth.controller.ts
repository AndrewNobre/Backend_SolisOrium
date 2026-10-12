import { Controller, Body, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SolicitarRecuperacaoSenhaDto } from './dto/recuperacao_senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir_senha.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.senha);
    }

    @Post('recuperar-senha')
    solicitarRecuperacaoSenha(@Body() dto: SolicitarRecuperacaoSenhaDto) {
        return this.authService.solicitarRecuperacaoSenha(dto.email);
    }

    @Post('redefinir-senha')
    redefinirSenha(@Body() dto: RedefinirSenhaDto) {
        return this.authService.redefinirSenha(
            dto.token,
            dto.novaSenha,
        );
    }
}
