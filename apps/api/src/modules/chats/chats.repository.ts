import { Injectable } from '@nestjs/common';
import { EstadoParticipante, EstadoSociedad, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({
      where: { id: sociedadId },
      include: {
        participantes: {
          where: { isActive: true, estadoParticipante: EstadoParticipante.ACTIVO },
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, email: true, telefono: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  buscarParticipacion(participanteId: string, sociedadId: string) {
    return this.prisma.participanteSociedad.findFirst({
      where: { id: participanteId, sociedadId, isActive: true, estadoParticipante: EstadoParticipante.ACTIVO },
      include: {
        usuario: {
          select: { id: true, nombres: true, apellidos: true, email: true, telefono: true },
        },
      },
    });
  }

  buscarParticipacionUsuario(usuarioId: string, sociedadId: string) {
    return this.prisma.participanteSociedad.findFirst({
      where: { usuarioId, sociedadId, isActive: true, estadoParticipante: EstadoParticipante.ACTIVO },
    });
  }

  buscarOCrearConversacion(sociedadId: string, participanteId: string, organizadorId: string) {
    return this.prisma.conversacionSociedad.upsert({
      where: { sociedadId_participanteId: { sociedadId, participanteId } },
      create: { sociedadId, participanteId, organizadorId },
      update: { isActive: true },
    });
  }

  listarConversaciones(sociedadId: string, participanteId?: string) {
    return this.prisma.conversacionSociedad.findMany({
      where: {
        sociedadId,
        isActive: true,
        participanteId,
      },
      include: {
        participante: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, email: true, telefono: true },
            },
          },
        },
        mensajes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            remitente: {
              select: { id: true, nombres: true, apellidos: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  listarMensajes(conversacionId: string) {
    return this.prisma.mensajeChat.findMany({
      where: { conversacionId },
      include: {
        remitente: {
          select: { id: true, nombres: true, apellidos: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  enviarMensaje(conversacionId: string, remitenteId: string, mensaje: string) {
    return this.prisma.$transaction(async (tx) => {
      const conversacion = await tx.conversacionSociedad.findUniqueOrThrow({
        where: { id: conversacionId },
        include: {
          sociedad: true,
          participante: { include: { usuario: true } },
        },
      });
      const creado = await tx.mensajeChat.create({
        data: { conversacionId, remitenteId, mensaje },
        include: {
          remitente: {
            select: { id: true, nombres: true, apellidos: true },
          },
        },
      });

      await tx.conversacionSociedad.update({
        where: { id: conversacionId },
        data: { updatedAt: new Date() },
      });

      const destinatarioId =
        remitenteId === conversacion.organizadorId ? conversacion.participante.usuarioId : conversacion.organizadorId;

      await tx.notificacion.create({
        data: {
          usuarioId: destinatarioId,
          titulo: 'Nuevo mensaje',
          mensaje:
            remitenteId === conversacion.organizadorId
              ? `El organizador escribio en ${conversacion.sociedad.nombre}.`
              : `${conversacion.participante.usuario.nombres} escribio en ${conversacion.sociedad.nombre}.`,
          tipo: TipoNotificacion.RECORDATORIO_PAGO,
          metadataJson: {
            sociedadId: conversacion.sociedadId,
            participanteId: conversacion.participanteId,
            destino: 'CHAT_SAN',
          },
        },
      });

      return creado;
    });
  }

  sociedadCerrada(estado: EstadoSociedad) {
    return estado === EstadoSociedad.FINALIZADA || estado === EstadoSociedad.CANCELADA;
  }
}
