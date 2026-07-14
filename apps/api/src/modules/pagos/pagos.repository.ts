import { Injectable } from '@nestjs/common';
import { EstadoCiclo, EstadoPago, FrecuenciaSociedad, TipoMovimientoHistorial, TipoNotificacion, TipoPago } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PagosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarCuota(cuotaPagoId: string) {
    return this.prisma.cuotaPago.findUnique({
      where: { id: cuotaPagoId },
      include: {
        ciclo: { include: { sociedad: true } },
        participante: { include: { usuario: true } },
        evidencias: true,
      },
    });
  }

  buscarCuotaAnterior(cicloId: string, participanteId: string, numeroCuota: number) {
    return this.prisma.cuotaPago.findUnique({
      where: {
        cicloId_participanteId_numeroCuota: {
          cicloId,
          participanteId,
          numeroCuota,
        },
      },
      select: {
        id: true,
        numeroCuota: true,
        estado: true,
      },
    });
  }

  async asegurarCuotasActivasUsuario(usuarioId: string) {
    const ciclos = await this.prisma.cicloSociedad.findMany({
      where: {
        estado: EstadoCiclo.ACTIVO,
        sociedad: {
          participantes: {
            some: { usuarioId, isActive: true, estadoParticipante: 'ACTIVO' },
          },
        },
      },
      include: {
        sociedad: {
          include: {
            participantes: {
              where: { isActive: true, estadoParticipante: 'ACTIVO' },
              select: { id: true },
            },
          },
        },
        cuotas: {
          select: { participanteId: true, numeroCuota: true },
        },
      },
    });

    for (const ciclo of ciclos) {
      const participantes = ciclo.sociedad.participantes;
      const cuotasExistentes = new Set(ciclo.cuotas.map((cuota) => `${cuota.participanteId}:${cuota.numeroCuota}`));
      const cuotasFaltantes = participantes.flatMap((participante) =>
        Array.from({ length: participantes.length }, (_, index) => {
          const numeroCuota = index + 1;

          if (cuotasExistentes.has(`${participante.id}:${numeroCuota}`)) {
            return null;
          }

          return {
            cicloId: ciclo.id,
            participanteId: participante.id,
            numeroCuota,
            monto: ciclo.sociedad.montoCuota,
            fechaVencimiento: this.calcularFecha(ciclo.fechaInicio, ciclo.sociedad.frecuencia, index),
            estado: EstadoPago.PENDIENTE,
          };
        }).filter((cuota): cuota is NonNullable<typeof cuota> => cuota !== null),
      );

      if (cuotasFaltantes.length > 0) {
        await this.prisma.cuotaPago.createMany({ data: cuotasFaltantes, skipDuplicates: true });
      }
    }
  }

  listarMisPagos(usuarioId: string) {
    return this.prisma.cuotaPago.findMany({
      where: {
        participante: { usuarioId, isActive: true },
      },
      include: {
        ciclo: {
          include: {
            sociedad: {
              select: { id: true, nombre: true, frecuencia: true, tipoPago: true, moneda: true },
            },
          },
        },
        evidencias: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ fechaVencimiento: 'asc' }, { numeroCuota: 'asc' }],
    });
  }

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({ where: { id: sociedadId } });
  }

  listarPagosSociedad(sociedadId: string) {
    return this.prisma.cuotaPago.findMany({
      where: {
        ciclo: { sociedadId },
      },
      include: {
        ciclo: {
          include: {
            sociedad: {
              select: { id: true, nombre: true, frecuencia: true, tipoPago: true, moneda: true },
            },
          },
        },
        participante: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
            },
          },
        },
        evidencias: {
          include: {
            usuarioCarga: {
              select: { id: true, nombres: true, apellidos: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ estado: 'desc' }, { fechaVencimiento: 'asc' }],
    });
  }

  reportar(cuotaPagoId: string, usuarioId: string, metodoPago: TipoPago, observacion?: string) {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuotaPago.update({
        where: { id: cuotaPagoId },
        data: {
          estado: EstadoPago.REPORTADO,
          fechaPago: new Date(),
          metodoPagoReportado: metodoPago,
          observacion,
        },
        include: { ciclo: { include: { sociedad: true } }, participante: { include: { usuario: true } } },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: cuota.ciclo.sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.PAGO_REPORTADO,
          descripcion: `Cuota #${cuota.numeroCuota} ciclo #${cuota.ciclo.numeroCiclo} reportada por ${cuota.participante.usuario.nombres} ${cuota.participante.usuario.apellidos}.`,
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: cuota.ciclo.sociedad.organizadorId,
          titulo: 'Pago reportado',
          mensaje: `${cuota.participante.usuario.nombres} reporto la cuota #${cuota.numeroCuota} del ciclo #${cuota.ciclo.numeroCiclo} en ${cuota.ciclo.sociedad.nombre}.`,
          tipo: TipoNotificacion.RECORDATORIO_PAGO,
          metadataJson: {
            sociedadId: cuota.ciclo.sociedadId,
            cicloId: cuota.cicloId,
            cuotaPagoId: cuota.id,
            destino: 'DETALLE_SAN',
          },
        },
      });

      return cuota;
    });
  }

  confirmarPagoPropioOrganizador(cuotaPagoId: string, usuarioId: string, metodoPago: TipoPago, observacion?: string) {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuotaPago.update({
        where: { id: cuotaPagoId },
        data: {
          estado: EstadoPago.CONFIRMADO,
          confirmadoPor: usuarioId,
          fechaPago: new Date(),
          metodoPagoReportado: metodoPago,
          observacion,
        },
        include: { ciclo: { include: { sociedad: true } }, participante: { include: { usuario: true } } },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: cuota.ciclo.sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.PAGO_CONFIRMADO,
          descripcion: `Cuota #${cuota.numeroCuota} ciclo #${cuota.ciclo.numeroCiclo} pagada y confirmada automaticamente por el organizador.`,
        },
      });

      return cuota;
    });
  }

  confirmar(cuotaPagoId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuotaPago.update({
        where: { id: cuotaPagoId },
        data: {
          estado: EstadoPago.CONFIRMADO,
          confirmadoPor: usuarioId,
          fechaPago: new Date(),
        },
        include: { ciclo: true, participante: true },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: cuota.ciclo.sociedadId,
          usuarioId: cuota.participante.usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.PAGO_CONFIRMADO,
          descripcion: `Cuota #${cuota.numeroCuota} ciclo #${cuota.ciclo.numeroCiclo} confirmada por el organizador.`,
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: cuota.participante.usuarioId,
          titulo: 'Pago confirmado',
          mensaje: `Tu cuota #${cuota.numeroCuota} del ciclo #${cuota.ciclo.numeroCiclo} fue confirmada por el organizador.`,
          tipo: TipoNotificacion.PAGO_CONFIRMADO,
          metadataJson: {
            sociedadId: cuota.ciclo.sociedadId,
            cicloId: cuota.cicloId,
            cuotaPagoId: cuota.id,
            destino: 'PAGOS',
          },
        },
      });

      return cuota;
    });
  }

  rechazar(cuotaPagoId: string, usuarioId: string, observacion: string) {
    return this.prisma.$transaction(async (tx) => {
      const cuota = await tx.cuotaPago.update({
        where: { id: cuotaPagoId },
        data: {
          estado: EstadoPago.RECHAZADO,
          confirmadoPor: usuarioId,
          observacion,
        },
        include: { ciclo: true, participante: true },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: cuota.ciclo.sociedadId,
          usuarioId: cuota.participante.usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.PAGO_RECHAZADO,
          descripcion: `Cuota #${cuota.numeroCuota} ciclo #${cuota.ciclo.numeroCiclo} rechazada: ${observacion}`,
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: cuota.participante.usuarioId,
          titulo: 'Pago rechazado',
          mensaje: observacion,
          tipo: TipoNotificacion.PAGO_RECHAZADO,
          metadataJson: {
            sociedadId: cuota.ciclo.sociedadId,
            cicloId: cuota.cicloId,
            cuotaPagoId: cuota.id,
            destino: 'PAGOS',
          },
        },
      });

      return cuota;
    });
  }

  private calcularFecha(inicio: Date, frecuencia: FrecuenciaSociedad, indice: number) {
    const fecha = new Date(inicio);
    const dias = frecuencia === FrecuenciaSociedad.SEMANAL ? 7 : frecuencia === FrecuenciaSociedad.QUINCENAL ? 15 : 30;
    fecha.setUTCDate(fecha.getUTCDate() + dias * indice);
    return fecha;
  }
}
