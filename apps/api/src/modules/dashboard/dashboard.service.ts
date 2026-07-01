import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly jobsService: JobsService,
  ) {}

  async resumen(usuarioId: string) {
    await this.jobsService.marcarPagosAtrasados();
    const [sociedadesActivas, pagosPendientes, proximoCobro, pagosReportadosPendientes, alertas] = await Promise.all([
      this.dashboardRepository.contarSociedadesActivas(usuarioId),
      this.dashboardRepository.listarPagosPendientes(usuarioId),
      this.dashboardRepository.buscarProximoCobro(usuarioId),
      this.dashboardRepository.contarPagosReportadosParaOrganizador(usuarioId),
      this.dashboardRepository.listarAlertas(usuarioId),
    ]);
    const totalPendiente = pagosPendientes.reduce((total, pago) => total + Number(pago.monto), 0);

    return {
      sociedadesActivas,
      pagosPendientes: pagosPendientes.length,
      totalPendiente,
      pagosReportadosPendientes,
      proximoPago: pagosPendientes[0]
        ? {
            id: pagosPendientes[0].id,
            sociedadId: pagosPendientes[0].ciclo.sociedad.id,
            sociedad: pagosPendientes[0].ciclo.sociedad.nombre,
            moneda: pagosPendientes[0].ciclo.sociedad.moneda,
            monto: Number(pagosPendientes[0].monto),
            estado: pagosPendientes[0].estado,
            numeroCuota: pagosPendientes[0].numeroCuota,
            fechaVencimiento: pagosPendientes[0].fechaVencimiento,
          }
        : null,
      proximoCobro: proximoCobro
        ? {
            id: proximoCobro.id,
            sociedadId: proximoCobro.ciclo.sociedad.id,
            sociedad: proximoCobro.ciclo.sociedad.nombre,
            moneda: proximoCobro.ciclo.sociedad.moneda,
            montoPlanificado: Number(proximoCobro.montoCobro),
            numeroTurno: proximoCobro.numeroTurno,
            fechaProgramada: proximoCobro.fechaProgramada,
          }
        : null,
      alertas: alertas.map((alerta) => ({
        id: alerta.id,
        titulo: alerta.titulo,
        mensaje: alerta.mensaje,
        tipo: alerta.tipo,
        createdAt: alerta.createdAt,
      })),
    };
  }
}
