import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../login/guards/jwt-auth.guard';
import { CriarPontoRecargaDto } from './dto/criar-ponto-recarga.dto';
import { PontosRecargaService } from './pontos-recarga.service';

// Controlador das rotas REST dos pontos de recarga.
@UseGuards(JwtAuthGuard)
@Controller('pontos-recarga')
export class PontosRecargaController {
  constructor(private readonly pontosRecargaService: PontosRecargaService) {}

  // Cadastra um novo ponto de recarga.
  @Post()
  criar(@Body() dto: CriarPontoRecargaDto) {
    return this.pontosRecargaService.criar(dto);
  }

  // Retorna todos os pontos para o mapa ou lista do aplicativo.
  @Get()
  listar() {
    return this.pontosRecargaService.listar();
  }

  // Retorna os dados de um ponto específico.
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.pontosRecargaService.buscarPorId(id);
  }
}
