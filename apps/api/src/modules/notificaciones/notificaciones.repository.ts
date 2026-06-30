import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  buscar(notificacionId: string) {
    return this.prisma.notificacion.findUnique({ where: { id: notificacionId } });
  }

  marcarLeida(notificacionId: string) {
    return this.prisma.notificacion.update({
      where: { id: notificacionId },
      data: { leida: true },
    });
  }
}
