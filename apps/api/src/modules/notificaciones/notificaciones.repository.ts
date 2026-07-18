import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  contarNoLeidas(usuarioId: string) {
    return this.prisma.notificacion.count({ where: { usuarioId, leida: false } });
  }

  marcarLeida(notificacionId: string) {
    return this.prisma.notificacion.update({
      where: { id: notificacionId },
      data: { leida: true },
    });
  }

  marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  }

  actualizarPushToken(usuarioId: string, pushToken: string | null) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { pushToken },
      select: { id: true, pushToken: true },
    });
  }

  obtenerPreferencia(usuarioId: string) {
    return this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { notificacionesHabilitadas: true, pushToken: true },
    });
  }

  actualizarPreferencia(usuarioId: string, habilitadas: boolean) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { notificacionesHabilitadas: habilitadas },
      select: { notificacionesHabilitadas: true, pushToken: true },
    });
  }

  listarPushTokens(usuarioIds: string[]) {
    return this.prisma.usuario.findMany({
      where: {
        id: { in: [...new Set(usuarioIds)] },
        isActive: true,
        notificacionesHabilitadas: true,
        pushToken: { not: null },
      },
      select: { id: true, pushToken: true },
    });
  }

  buscarUltimaParaUsuario(usuarioId: string, createdAtGte: Date) {
    return this.prisma.notificacion.findFirst({
      where: { usuarioId, createdAt: { gte: createdAtGte } },
      orderBy: { createdAt: 'desc' },
    });
  }

  limpiarPushTokens(pushTokens: string[]) {
    return this.prisma.usuario.updateMany({
      where: { pushToken: { in: [...new Set(pushTokens)] } },
      data: { pushToken: null },
    });
  }
}

export type NotificacionParaPush = Prisma.NotificacionGetPayload<Record<string, never>>;
