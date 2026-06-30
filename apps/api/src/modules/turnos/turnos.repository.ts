import { Injectable } from '@nestjs/common';
import { EstadoPago, EstadoTurno, Prisma, TipoMovimientoHistorial, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type TurnoInput = {
  participanteId: string;
  numeroTurno: number;
  fechaProgramada: Date;
  montoCobro: Prisma.Decimal;
};

@Injectable()
export class TurnosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarCiclo(cicloId: string) {
    return this.prisma.cicloSociedad.findUnique({
      where: { id: cicloId },
      include: {
        sociedad: true,
        turnos: true,
      },
    });
  }

  listarParticipantesActivos(sociedadId: string) {
    return this.prisma.participanteSociedad.findMany({
      where: { sociedadId, isActive: true, estadoParticipante: 'ACTIVO' },
      include: {
        usuario: {
          select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  listar(cicloId: string) {
    return this.prisma.turnoCobro.findMany({
      where: { cicloId },
      include: {
        participante: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
            },
          },
        },
      },
      orderBy: { numeroTurno: 'asc' },
    });
  }

  buscarTurno(turnoId: string) {
    return this.prisma.turnoCobro.findUnique({
      where: { id: turnoId },
      include: {
        ciclo: { include: { sociedad: true } },
        participante: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
            },
          },
        },
      },
    });
  }

  resumenPagosConfirmadosTurno(cicloId: string, numeroTurno: number) {
    return this.prisma.cuotaPago.aggregate({
      where: {
        cicloId,
        numeroCuota: numeroTurno,
        estado: EstadoPago.CONFIRMADO,
      },
      _count: { _all: true },
      _sum: { monto: true },
    });
  }

  guardarTurnos(cicloId: string, sociedadId: string, usuarioId: string, turnos: TurnoInput[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.turnoCobro.deleteMany({ where: { cicloId } });
      await tx.turnoCobro.createMany({
        data: turnos.map((turno) => ({
          cicloId,
          participanteId: turno.participanteId,
          numeroTurno: turno.numeroTurno,
          fechaProgramada: turno.fechaProgramada,
          montoCobro: turno.montoCobro,
          estado: EstadoTurno.PENDIENTE,
          fechaEntrega: null,
          entregadoPor: null,
        })),
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.TURNO_GENERADO,
          descripcion: 'Turnos generados.',
        },
      });

      return tx.turnoCobro.findMany({
        where: { cicloId },
        orderBy: { numeroTurno: 'asc' },
      });
    });
  }

  registrarEntrega(turnoId: string, usuarioId: string, montoEntregado: Prisma.Decimal, entregaIncompleta: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const turno = await tx.turnoCobro.update({
        where: { id: turnoId },
        data: {
          estado: EstadoTurno.PAGADO,
          fechaEntrega: new Date(),
          entregadoPor: usuarioId,
          montoEntregado,
          entregaIncompleta,
        },
        include: {
          ciclo: { include: { sociedad: true } },
          participante: {
            include: {
              usuario: {
                select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
              },
            },
          },
        },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: turno.ciclo.sociedadId,
          usuarioId: turno.participante.usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.TURNO_ENTREGADO,
          descripcion: entregaIncompleta
            ? `Turno #${turno.numeroTurno} entregado incompleto a ${turno.participante.usuario.nombres} ${turno.participante.usuario.apellidos}.`
            : `Turno #${turno.numeroTurno} entregado a ${turno.participante.usuario.nombres} ${turno.participante.usuario.apellidos}.`,
          metadataJson: {
            turnoId: turno.id,
            montoPlanificado: Number(turno.montoCobro),
            montoEntregado: Number(turno.montoEntregado ?? 0),
            entregaIncompleta,
            fechaEntrega: turno.fechaEntrega,
          },
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: turno.participante.usuarioId,
          titulo: entregaIncompleta ? 'Entrega registrada incompleta' : 'Entrega registrada',
          mensaje: entregaIncompleta
            ? `Tu turno #${turno.numeroTurno} fue registrado con entrega incompleta.`
            : `Tu turno #${turno.numeroTurno} fue registrado como entregado.`,
          tipo: TipoNotificacion.PROXIMO_COBRO,
          metadataJson: {
            sociedadId: turno.ciclo.sociedadId,
            turnoId: turno.id,
            montoPlanificado: Number(turno.montoCobro),
            montoEntregado: Number(turno.montoEntregado ?? 0),
            entregaIncompleta,
            destino: 'DETALLE_SAN',
          },
        },
      });

      return turno;
    });
  }
}
