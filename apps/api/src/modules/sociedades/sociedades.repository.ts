import { Injectable } from '@nestjs/common';
import {
  EstadoCiclo,
  EstadoPago,
  EstadoParticipante,
  EstadoSociedad,
  EstadoTurno,
  Prisma,
  TipoMovimientoHistorial,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearSociedadDto } from './dto/crear-sociedad.dto';

@Injectable()
export class SociedadesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarUsuario(usuarioId: string) {
    return this.prisma.usuario.findUnique({ where: { id: usuarioId } });
  }

  crearConOrganizador(organizadorId: string, dto: CrearSociedadDto) {
    return this.prisma.$transaction(async (tx) => {
      const sociedad = await tx.sociedad.create({
        data: {
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim(),
          organizadorId,
          montoCuota: new Prisma.Decimal(dto.montoCuota),
          moneda: dto.moneda,
          frecuencia: dto.frecuencia,
          modalidadTurnos: dto.modalidadTurnos,
          tipoPago: dto.tipoPago,
          cantidadParticipantes: dto.cantidadParticipantes,
          fechaInicio: dto.fechaInicio,
          fechaFinEstimada: dto.fechaFinEstimada,
        },
      });

      await tx.participanteSociedad.create({
        data: {
          sociedadId: sociedad.id,
          usuarioId: organizadorId,
          estadoParticipante: EstadoParticipante.ACTIVO,
          fechaIngreso: new Date(),
        },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: sociedad.id,
          usuarioId: organizadorId,
          realizadoPor: organizadorId,
          accion: TipoMovimientoHistorial.SOCIEDAD_CREADA,
          descripcion: 'Sociedad creada.',
        },
      });

      return sociedad;
    });
  }

  listarDelUsuario(usuarioId: string) {
    return this.prisma.sociedad.findMany({
      where: {
        OR: [{ organizadorId: usuarioId }, { participantes: { some: { usuarioId, isActive: true } } }],
      },
      include: {
        _count: {
          select: {
            participantes: true,
            ciclos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  buscarAccesible(usuarioId: string, sociedadId: string) {
    return this.prisma.sociedad.findFirst({
      where: {
        id: sociedadId,
        OR: [{ organizadorId: usuarioId }, { participantes: { some: { usuarioId, isActive: true } } }],
      },
      include: {
        participantes: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, telefono: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ciclos: {
          orderBy: { numeroCiclo: 'desc' },
        },
      },
    });
  }

  buscarPorId(sociedadId: string) {
    return this.prisma.sociedad.findUnique({ where: { id: sociedadId } });
  }

  actualizar(sociedadId: string, data: Prisma.SociedadUpdateInput) {
    return this.prisma.sociedad.update({
      where: { id: sociedadId },
      data,
    });
  }

  cerrar(sociedadId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sociedad = await tx.sociedad.update({
        where: { id: sociedadId },
        data: { estado: EstadoSociedad.CANCELADA },
      });

      const ciclos = await tx.cicloSociedad.findMany({
        where: { sociedadId },
        select: { id: true },
      });
      const cicloIds = ciclos.map((ciclo) => ciclo.id);

      if (cicloIds.length > 0) {
        await tx.cuotaPago.updateMany({
          where: {
            cicloId: { in: cicloIds },
            estado: { notIn: [EstadoPago.CONFIRMADO, EstadoPago.CANCELADO] },
          },
          data: {
            estado: EstadoPago.CANCELADO,
            observacion: 'Cancelado por cierre de sociedad.',
          },
        });

        await tx.turnoCobro.updateMany({
          where: {
            cicloId: { in: cicloIds },
            estado: { notIn: [EstadoTurno.PAGADO, EstadoTurno.CANCELADO] },
          },
          data: {
            estado: EstadoTurno.CANCELADO,
          },
        });

        await tx.cicloSociedad.updateMany({
          where: {
            id: { in: cicloIds },
            OR: [
              { estado: { in: [EstadoCiclo.CONFIGURACION, EstadoCiclo.ACTIVO] } },
              { turnos: { some: { estado: EstadoTurno.CANCELADO } } },
              { cuotas: { some: { estado: EstadoPago.CANCELADO } } },
            ],
          },
          data: { estado: EstadoCiclo.CANCELADO, fechaFin: new Date() },
        });
      }

      await tx.historialMovimiento.create({
        data: {
          sociedadId,
          usuarioId,
          realizadoPor: usuarioId,
          accion: TipoMovimientoHistorial.SOCIEDAD_CERRADA,
          descripcion: 'Sociedad cerrada por el organizador.',
        },
      });

      return sociedad;
    });
  }
}
