import { Injectable } from '@nestjs/common';
import { EstadoPago } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarSociedad(sociedadId: string) {
    return this.prisma.sociedad.findUnique({
      where: { id: sociedadId },
      include: {
        participantes: { where: { isActive: true } },
        ciclos: { orderBy: { numeroCiclo: 'desc' }, take: 1 },
      },
    });
  }

  buscarParticipacion(usuarioId: string, sociedadId: string) {
    return this.prisma.participanteSociedad.findFirst({
      where: { usuarioId, sociedadId, isActive: true },
    });
  }

  agruparCuotasPorEstado(cicloId: string) {
    return this.prisma.cuotaPago.groupBy({
      by: ['estado'],
      where: { cicloId },
      _count: { _all: true },
      _sum: { monto: true },
    });
  }

  sumarConfirmadas(cicloId: string) {
    return this.prisma.cuotaPago.aggregate({
      where: { cicloId, estado: EstadoPago.CONFIRMADO },
      _sum: { monto: true },
      _count: { _all: true },
    });
  }

  listarCuotasConParticipante(cicloId: string) {
    return this.prisma.cuotaPago.findMany({
      where: { cicloId },
      include: {
        participante: {
          include: {
            usuario: {
              select: { id: true, nombres: true, apellidos: true, email: true, telefono: true },
            },
          },
        },
      },
      orderBy: [{ participante: { usuario: { nombres: 'asc' } } }, { numeroCuota: 'asc' }],
    });
  }
}
