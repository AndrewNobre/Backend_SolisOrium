import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CriarPontoRecargaDto } from './dto/criar-ponto-recarga.dto';
import { RecargaService } from './recarga.service';

// Controlador das rotas REST dos pontos de recarga.
@UseGuards(JwtAuthGuard)
@Controller('pontos-recarga')
export class RecargaController {
    constructor(private readonly recargaService: RecargaService) { }

    // Cadastra um novo ponto de recarga.
    @Post()
    criar(@Body() dto: CriarPontoRecargaDto) {
        return this.recargaService.criar(dto);
    }

    // Retorna todos os pontos para o mapa ou lista do aplicativo.
    @Get()
    listar() {
        return this.recargaService.listar();
    }

    // Retorna os dados de um ponto específico.
    @Get(':id')
    buscarPorId(@Param('id') id: string) {
        return this.recargaService.buscarPorId(id);
    }
}