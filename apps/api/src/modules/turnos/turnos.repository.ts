import { Injectable } from '@nestjs/common';
import { EstadoTurno, Prisma, TipoMovimientoHistorial } from '@prisma/client';
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

  registrarEntrega(turnoId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const turno = await tx.turnoCobro.update({
        where: { id: turnoId },
        data: {
          estado: EstadoTurno.PAGADO,
          fechaEntrega: new Date(),
          entregadoPor: usuarioId,
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
          descripcion: `Turno #${turno.numeroTurno} entregado a ${turno.participante.usuario.nombres} ${turno.participante.usuario.apellidos}.`,
          metadataJson: {
            turnoId: turno.id,
            montoCobro: Number(turno.montoCobro),
            fechaEntrega: turno.fechaEntrega,
          },
        },
      });

      return turno;
    });
  }
}
