import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrarEventoDto } from './dto/registrar-evento.dto';

@Injectable()
export class AnaliticasService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarEvento(usuarioId: string, dto: RegistrarEventoDto) {
    const evento = await this.prisma.eventoAnalitica.create({
      data: {
        usuarioId,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        plataforma: dto.plataforma,
        versionApp: dto.versionApp,
        metadataJson: dto.metadataJson as Prisma.InputJsonValue | undefined,
      },
      select: {
        id: true,
        nombre: true,
        createdAt: true,
      },
    });

    return {
      mensaje: 'Evento registrado.',
      evento,
    };
  }
}
