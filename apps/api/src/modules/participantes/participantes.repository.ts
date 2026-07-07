import { Injectable } from '@nestjs/common';
import {
  EstadoInvitacion,
  EstadoParticipante,
  TipoNotificacion,
  TipoMovimientoHistorial,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';

@Injectable()
export class ParticipantesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({ where: { id: sociedadId } });
  }

  buscarUsuario(usuarioId: string) {
    return this.prisma.usuario.findUnique({ where: { id: usuarioId } });
  }

  buscarUsuarioPorInvitacion(dto: CrearInvitacionDto) {
    const email = dto.emailInvitado?.toLowerCase().trim();
    const telefono = dto.telefonoInvitado?.trim();

    return this.prisma.usuario.findFirst({
      where: {
        isActive: true,
        OR: [
          email ? { email } : undefined,
          telefono ? { telefono } : undefined,
        ].filter(Boolean) as Array<{ email: string } | { telefono: string }>,
      },
    });
  }

  buscarParticipante(participanteId: string) {
    return this.prisma.participanteSociedad.findUnique({
      where: { id: participanteId },
      include: { sociedad: true, usuario: true },
    });
  }

  listarParticipantes(sociedadId: string) {
    return this.prisma.participanteSociedad.findMany({
      where: { sociedadId, isActive: true },
      include: {
        usuario: {
          select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
        },
      },
      orderBy: [{ turno: 'asc' }, { createdAt: 'asc' }],
    });
  }

  buscarAcceso(usuarioId: string, sociedadId: string) {
    return this.prisma.participanteSociedad.findFirst({
      where: { usuarioId, sociedadId, isActive: true },
    });
  }

  buscarInvitacion(invitacionId: string) {
    return this.prisma.invitacionSociedad.findUnique({
      where: { id: invitacionId },
      include: { sociedad: true },
    });
  }

  listarInvitacionesDelUsuario(email: string, telefono: string) {
    return this.prisma.invitacionSociedad.findMany({
      where: {
        estado: EstadoInvitacion.PENDIENTE,
        OR: [{ emailInvitado: email.toLowerCase() }, { telefonoInvitado: telefono }],
      },
      include: {
        sociedad: {
          select: {
            id: true,
            nombre: true,
            montoCuota: true,
            moneda: true,
            frecuencia: true,
            estado: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  crearInvitacion(sociedadId: string, enviadaPor: string, dto: CrearInvitacionDto) {
    const emailInvitado = dto.emailInvitado?.toLowerCase().trim();
    const telefonoInvitado = dto.telefonoInvitado?.trim();

    return this.prisma.$transaction(async (tx) => {
      const invitacion = await tx.invitacionSociedad.create({
        data: {
          sociedadId,
          enviadaPor,
          telefonoInvitado,
          emailInvitado,
        },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId,
          usuarioId: enviadaPor,
          realizadoPor: enviadaPor,
          accion: TipoMovimientoHistorial.INVITACION_ENVIADA,
          descripcion: 'Invitacion enviada.',
          metadataJson: {
            telefonoInvitado,
            emailInvitado,
          },
        },
      });

      const usuarioInvitado = await tx.usuario.findFirst({
        where: {
          isActive: true,
          OR: [
            emailInvitado ? { email: emailInvitado } : undefined,
            telefonoInvitado ? { telefono: telefonoInvitado } : undefined,
          ].filter(Boolean) as Array<{ email: string } | { telefono: string }>,
        },
      });

      if (usuarioInvitado) {
        await tx.notificacion.create({
          data: {
            usuarioId: usuarioInvitado.id,
            titulo: 'Invitacion recibida',
            mensaje: 'Te invitaron a una sociedad.',
            tipo: TipoNotificacion.INVITACION_RECIBIDA,
          },
        });
      }

      return invitacion;
    });
  }

  aceptarInvitacion(invitacionId: string, usuarioId: string, sociedadId: string) {
    return this.prisma.$transaction(async (tx) => {
      const participante = await tx.participanteSociedad.upsert({
        where: {
          usuarioId_sociedadId: {
            usuarioId,
            sociedadId,
          },
        },
        create: {
          usuarioId,
          sociedadId,
          estadoParticipante: EstadoParticipante.ACTIVO,
          fechaIngreso: new Date(),
        },
        update: {
          estadoParticipante: EstadoParticipante.ACTIVO,
          fechaIngreso: new Date(),
          isActive: true,
        },
      });

      await tx.invitacionSociedad.update({
        where: { id: invitacionId },
        data: { estado: EstadoInvitacion.ACEPTADA, fechaRespuesta: new Date() },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.INVITACION_ACEPTADA,
          descripcion: 'Invitacion aceptada.',
        },
      });

      return participante;
    });
  }

  rechazarInvitacion(invitacionId: string) {
    return this.prisma.invitacionSociedad.update({
      where: { id: invitacionId },
      data: { estado: EstadoInvitacion.RECHAZADA, fechaRespuesta: new Date() },
    });
  }

  expulsarParticipante(participanteId: string, realizadoPor: string, motivo: string) {
    return this.prisma.$transaction(async (tx) => {
      const participante = await tx.participanteSociedad.update({
        where: { id: participanteId },
        data: {
          estadoParticipante: EstadoParticipante.EXPULSADO,
          observacion: motivo,
          isActive: false,
        },
        include: { sociedad: true, usuario: true },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: participante.sociedadId,
          usuarioId: participante.usuarioId,
          realizadoPor,
          accion: TipoMovimientoHistorial.PARTICIPANTE_EXPULSADO,
          descripcion: motivo,
        },
      });

      return participante;
    });
  }
}
