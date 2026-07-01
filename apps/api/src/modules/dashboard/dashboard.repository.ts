import { Injectable } from '@nestjs/common';
import { EstadoCiclo, EstadoPago, EstadoSociedad, EstadoTurno } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  contarSociedadesActivas(usuarioId: string) {
    return this.prisma.sociedad.count({
      where: {
        estado: EstadoSociedad.ACTIVA,
        OR: [{ organizadorId: usuarioId }, { participantes: { some: { usuarioId, isActive: true } } }],
      },
    });
  }

  listarPagosPendientes(usuarioId: string) {
    return this.prisma.cuotaPago.findMany({
      where: {
        participante: { usuarioId, isActive: true },
        estado: { in: [EstadoPago.PENDIENTE, EstadoPago.ATRASADO, EstadoPago.RECHAZADO] },
      },
      include: {
        ciclo: {
          include: {
            sociedad: {
              select: { id: true, nombre: true, moneda: true },
            },
          },
        },
      },
      orderBy: [{ fechaVencimiento: 'asc' }, { numeroCuota: 'asc' }],
    });
  }

  buscarProximoCobro(usuarioId: string) {
    return this.prisma.turnoCobro.findFirst({
      where: {
        estado: EstadoTurno.PENDIENTE,
        participante: { usuarioId, isActive: true },
        ciclo: { estado: EstadoCiclo.ACTIVO },
      },
      include: {
        ciclo: {
          include: {
            sociedad: {
              select: { id: true, nombre: true, moneda: true },
            },
          },
        },
      },
      orderBy: [{ fechaProgramada: 'asc' }, { numeroTurno: 'asc' }],
    });
  }

  contarPagosReportadosParaOrganizador(usuarioId: string) {
    return this.prisma.cuotaPago.count({
      where: {
        estado: EstadoPago.REPORTADO,
        ciclo: { sociedad: { organizadorId: usuarioId } },
      },
    });
  }

  listarAlertas(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId, leida: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }
}
