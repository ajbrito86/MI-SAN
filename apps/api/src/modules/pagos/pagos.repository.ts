import { Injectable } from '@nestjs/common';
import { EstadoPago, TipoMovimientoHistorial, TipoNotificacion, TipoPago } from '@prisma/client';
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
          descripcion: `Pago reportado por ${cuota.participante.usuario.nombres} ${cuota.participante.usuario.apellidos}.`,
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: cuota.ciclo.sociedad.organizadorId,
          titulo: 'Pago reportado',
          mensaje: `${cuota.participante.usuario.nombres} reporto una cuota en ${cuota.ciclo.sociedad.nombre}.`,
          tipo: TipoNotificacion.RECORDATORIO_PAGO,
          metadataJson: {
            sociedadId: cuota.ciclo.sociedadId,
            cuotaPagoId: cuota.id,
            destino: 'DETALLE_SAN',
          },
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
          descripcion: 'Pago confirmado por el organizador.',
        },
      });

      await tx.notificacion.create({
        data: {
          usuarioId: cuota.participante.usuarioId,
          titulo: 'Pago confirmado',
          mensaje: 'Tu pago fue confirmado por el organizador.',
          tipo: TipoNotificacion.PAGO_CONFIRMADO,
          metadataJson: {
            sociedadId: cuota.ciclo.sociedadId,
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
          descripcion: observacion,
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
            cuotaPagoId: cuota.id,
            destino: 'PAGOS',
          },
        },
      });

      return cuota;
    });
  }
}
