import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import type { RequisicaoAutenticada } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CriarReservaDto } from './dto/criar-reserva.dto';
import { ReservasService } from './reservas.service';

@UseGuards(JwtAuthGuard)
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  criar(@Req() request: RequisicaoAutenticada, @Body() dto: CriarReservaDto) {
    return this.reservasService.criar(request.user.sub, dto.pontoRecargaId);
  }

  @Get()
  listar(@Req() request: RequisicaoAutenticada) {
    return this.reservasService.listar(request.user.sub);
  }

  @Patch(':id/cancelar')
  cancelar(
    @Req() request: RequisicaoAutenticada,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reservasService.cancelar(request.user.sub, id);
  }
}
