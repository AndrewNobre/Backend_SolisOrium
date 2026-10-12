import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CriarPontoRecargaDto } from './dto/criar-ponto-recarga.dto';

// Serviço responsável pelas operações de persistência dos pontos de recarga.
@Injectable()
export class RecargaService {
  constructor(private readonly prisma: PrismaService) { }

  // Cadastra um ponto com a localização definida no sistema.
  async criar(dto: CriarPontoRecargaDto) {
    return this.prisma.pontoRecarga.create({
      data: dto,
    });
  }

  // Lista os pontos para exibição no mapa e em listas do frontend.
  async listar() {
    return this.prisma.pontoRecarga.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  // Busca os detalhes de um ponto específico.
  async buscarPorId(id: string) {
    const pontoRecarga = await this.prisma.pontoRecarga.findUnique({
      where: { id },
    });

    if (!pontoRecarga) {
      throw new NotFoundException('Ponto de recarga não encontrado.');
    }

    return pontoRecarga;
  }
}