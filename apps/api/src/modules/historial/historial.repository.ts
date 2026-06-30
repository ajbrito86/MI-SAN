import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HistorialRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({ where: { id: sociedadId } });
  }

  buscarParticipacion(usuarioId: string, sociedadId: string) {
    return this.prisma.participanteSociedad.findFirst({
      where: { usuarioId, sociedadId, isActive: true },
    });
  }

  listar(sociedadId: string) {
    return this.prisma.historialMovimiento.findMany({
      where: { sociedadId },
      include: {
        realizador: {
          select: { id: true, nombres: true, apellidos: true },
        },
        usuario: {
          select: { id: true, nombres: true, apellidos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
