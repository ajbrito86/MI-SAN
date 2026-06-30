import { Injectable } from '@nestjs/common';
import {
  EstadoCiclo,
  EstadoPago,
  EstadoSociedad,
  EstadoTurno,
  FrecuenciaSociedad,
  Prisma,
  TipoMovimientoHistorial,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CiclosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({
      where: { id: sociedadId },
      include: {
        ciclos: { orderBy: { numeroCiclo: 'desc' }, take: 1 },
        participantes: { where: { isActive: true, estadoParticipante: 'ACTIVO' } },
      },
    });
  }

  buscarCiclo(cicloId: string) {
    return this.prisma.cicloSociedad.findUnique({
      where: { id: cicloId },
      include: {
        sociedad: true,
        turnos: true,
        cuotas: true,
      },
    });
  }

  listarParticipantesActivos(sociedadId: string) {
    return this.prisma.participanteSociedad.findMany({
      where: { sociedadId, isActive: true, estadoParticipante: 'ACTIVO' },
    });
  }

  crear(sociedadId: string, usuarioId: string, numeroCiclo: number, fechaInicio: Date) {
    return this.prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloSociedad.create({
        data: { sociedadId, numeroCiclo, fechaInicio },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.CICLO_CREADO,
          descripcion: `Ciclo #${numeroCiclo} creado.`,
        },
      });

      return ciclo;
    });
  }

  iniciar(cicloId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloSociedad.findUniqueOrThrow({
        where: { id: cicloId },
        include: {
          sociedad: true,
          turnos: { orderBy: { numeroTurno: 'asc' } },
          cuotas: true,
        },
      });

      const participantes = await tx.participanteSociedad.findMany({
        where: { sociedadId: ciclo.sociedadId, isActive: true, estadoParticipante: 'ACTIVO' },
      });

      if (ciclo.cuotas.length === 0) {
        const cuotas = participantes.flatMap((participante) =>
          Array.from({ length: participantes.length }, (_, index) => ({
            cicloId,
            participanteId: participante.id,
            numeroCuota: index + 1,
            monto: ciclo.sociedad.montoCuota,
            fechaVencimiento: this.calcularFecha(ciclo.fechaInicio, ciclo.sociedad.frecuencia, index),
            estado: EstadoPago.PENDIENTE,
          })),
        );

        await tx.cuotaPago.createMany({ data: cuotas });
      }

      await tx.turnoCobro.updateMany({
        where: { cicloId },
        data: { estado: EstadoTurno.PENDIENTE },
      });

      const actualizado = await tx.cicloSociedad.update({
        where: { id: cicloId },
        data: { estado: EstadoCiclo.ACTIVO },
      });

      await tx.sociedad.update({
        where: { id: ciclo.sociedadId },
        data: { estado: EstadoSociedad.ACTIVA },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: ciclo.sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.CICLO_INICIADO,
          descripcion: `Ciclo #${ciclo.numeroCiclo} iniciado.`,
        },
      });

      return actualizado;
    });
  }

  finalizar(cicloId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const ciclo = await tx.cicloSociedad.update({
        where: { id: cicloId },
        data: { estado: EstadoCiclo.COMPLETADO, fechaFin: new Date() },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: ciclo.sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.CICLO_FINALIZADO,
          descripcion: `Ciclo #${ciclo.numeroCiclo} finalizado.`,
        },
      });

      return ciclo;
    });
  }

  private calcularFecha(inicio: Date, frecuencia: FrecuenciaSociedad, indice: number) {
    const fecha = new Date(inicio);
    const dias = frecuencia === FrecuenciaSociedad.SEMANAL ? 7 : frecuencia === FrecuenciaSociedad.QUINCENAL ? 15 : 30;
    fecha.setUTCDate(fecha.getUTCDate() + dias * indice);
    return fecha;
  }
}
