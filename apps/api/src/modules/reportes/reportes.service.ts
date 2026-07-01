import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoPago } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';
import { ReportesRepository } from './reportes.repository';

@Injectable()
export class ReportesService {
  constructor(
    private readonly reportesRepository: ReportesRepository,
    private readonly jobsService: JobsService,
  ) {}

  async resumenSociedad(usuarioId: string, sociedadId: string) {
    await this.jobsService.marcarPagosAtrasados();
    const sociedad = await this.reportesRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId !== usuarioId) {
      const participacion = await this.reportesRepository.buscarParticipacion(usuarioId, sociedadId);

      if (!participacion) {
        throw new ForbiddenException('No tienes permiso para ver este reporte.');
      }
    }

    const cicloActual = sociedad.ciclos[0] ?? null;

    if (!cicloActual) {
      return {
        sociedadId: sociedad.id,
        nombre: sociedad.nombre,
        moneda: sociedad.moneda,
        estado: sociedad.estado,
        participantesActivos: sociedad.participantes.length,
        cicloActual: null,
        cuotasPorEstado: {},
        totalConfirmado: 0,
        pagosConfirmados: 0,
        participantesResumen: [],
      };
    }

    const [agrupadas, confirmadas, cuotas] = await Promise.all([
      this.reportesRepository.agruparCuotasPorEstado(cicloActual.id),
      this.reportesRepository.sumarConfirmadas(cicloActual.id),
      this.reportesRepository.listarCuotasConParticipante(cicloActual.id),
    ]);
    const participantesResumen = new Map<
      string,
      {
        participanteId: string;
        usuario: {
          id: string;
          nombres: string;
          apellidos: string;
          email: string;
          telefono: string;
        };
        totalConfirmado: number;
        totalPendiente: number;
        totalAtrasado: number;
        cuotasConfirmadas: number;
        cuotasPendientes: number;
        cuotasAtrasadas: number;
      }
    >();

    for (const cuota of cuotas) {
      const existente =
        participantesResumen.get(cuota.participanteId) ??
        {
          participanteId: cuota.participanteId,
          usuario: cuota.participante.usuario,
          totalConfirmado: 0,
          totalPendiente: 0,
          totalAtrasado: 0,
          cuotasConfirmadas: 0,
          cuotasPendientes: 0,
          cuotasAtrasadas: 0,
        };
      const monto = Number(cuota.monto);

      if (cuota.estado === EstadoPago.CONFIRMADO) {
        existente.totalConfirmado += monto;
        existente.cuotasConfirmadas += 1;
      } else if (cuota.estado === EstadoPago.ATRASADO || cuota.estado === EstadoPago.INCUMPLIDO) {
        existente.totalAtrasado += monto;
        existente.cuotasAtrasadas += 1;
      } else if (cuota.estado === EstadoPago.CANCELADO) {
        // Las cuotas canceladas quedan como historico, no como deuda activa.
      } else {
        existente.totalPendiente += monto;
        existente.cuotasPendientes += 1;
      }

      participantesResumen.set(cuota.participanteId, existente);
    }

    return {
      sociedadId: sociedad.id,
      nombre: sociedad.nombre,
      moneda: sociedad.moneda,
      estado: sociedad.estado,
      participantesActivos: sociedad.participantes.length,
      cicloActual: {
        id: cicloActual.id,
        numeroCiclo: cicloActual.numeroCiclo,
        estado: cicloActual.estado,
      },
      cuotasPorEstado: Object.fromEntries(
        agrupadas.map((grupo) => [
          grupo.estado,
          {
            cantidad: grupo._count._all,
            monto: Number(grupo._sum.monto ?? 0),
          },
        ]),
      ),
      totalConfirmado: Number(confirmadas._sum.monto ?? 0),
      pagosConfirmados: confirmadas._count._all,
      participantesResumen: [...participantesResumen.values()].sort(
        (a, b) => b.totalAtrasado - a.totalAtrasado || b.totalPendiente - a.totalPendiente,
      ),
    };
  }
}
