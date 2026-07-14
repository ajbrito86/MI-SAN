import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCiclo, EstadoPago, EstadoSociedad, TipoPago } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ReportarPagoDto } from './dto/reportar-pago.dto';
import { PagosRepository } from './pagos.repository';

const METODOS_REPORTABLES: TipoPago[] = [TipoPago.EFECTIVO, TipoPago.DEPOSITO_BANCARIO, TipoPago.TRANSFERENCIA];

@Injectable()
export class PagosService {
  constructor(
    private readonly pagosRepository: PagosRepository,
    private readonly jobsService: JobsService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async listarMisPagos(usuarioId: string) {
    await this.jobsService.marcarPagosAtrasados();
    await this.pagosRepository.asegurarCuotasActivasUsuario(usuarioId);
    const pagos = await this.pagosRepository.listarMisPagos(usuarioId);
    return pagos.map((pago) => ({
      id: pago.id,
      sociedad: pago.ciclo.sociedad,
      ciclo: {
        id: pago.ciclo.id,
        numeroCiclo: pago.ciclo.numeroCiclo,
        estado: pago.ciclo.estado,
      },
      numeroCuota: pago.numeroCuota,
      monto: Number(pago.monto),
      fechaVencimiento: pago.fechaVencimiento,
      fechaPago: pago.fechaPago,
      estado: pago.estado,
      observacion: pago.observacion,
      metodoPagoReportado: pago.metodoPagoReportado,
      evidencias: pago.evidencias.map((evidencia) => ({
        id: evidencia.id,
        urlArchivo: evidencia.urlArchivo,
        nombreArchivo: evidencia.nombreArchivo,
        mimeType: evidencia.mimeType,
        createdAt: evidencia.createdAt,
      })),
    }));
  }

  async listarPagosSociedad(usuarioId: string, sociedadId: string) {
    await this.jobsService.marcarPagosAtrasados();
    const sociedad = await this.pagosRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    this.validarOrganizador(usuarioId, sociedad.organizadorId);
    const pagos = await this.pagosRepository.listarPagosSociedad(sociedadId);

    return pagos.map((pago) => ({
      id: pago.id,
      sociedad: pago.ciclo.sociedad,
      ciclo: {
        id: pago.ciclo.id,
        numeroCiclo: pago.ciclo.numeroCiclo,
        estado: pago.ciclo.estado,
      },
      participante: pago.participante.usuario,
      numeroCuota: pago.numeroCuota,
      monto: Number(pago.monto),
      fechaVencimiento: pago.fechaVencimiento,
      fechaPago: pago.fechaPago,
      estado: pago.estado,
      observacion: pago.observacion,
      metodoPagoReportado: pago.metodoPagoReportado,
      evidencias: pago.evidencias.map((evidencia) => ({
        id: evidencia.id,
        urlArchivo: evidencia.urlArchivo,
        nombreArchivo: evidencia.nombreArchivo,
        mimeType: evidencia.mimeType,
        createdAt: evidencia.createdAt,
        cargadoPor: evidencia.usuarioCarga,
      })),
    }));
  }

  async reportar(usuarioId: string, dto: ReportarPagoDto) {
    const cuota = await this.validarCuota(dto.cuotaPagoId);

    if (cuota.participante.usuarioId !== usuarioId) {
      throw new ForbiddenException('No puedes reportar pagos de otro participante.');
    }

    if (cuota.ciclo.estado !== EstadoCiclo.ACTIVO) {
      throw new BadRequestException('No se permiten pagos sobre ciclos cerrados o no iniciados.');
    }

    this.validarSociedadOperativa(cuota.ciclo.sociedad.estado);

    const estadosReportables: EstadoPago[] = [EstadoPago.PENDIENTE, EstadoPago.ATRASADO, EstadoPago.RECHAZADO];

    if (!estadosReportables.includes(cuota.estado)) {
      throw new BadRequestException('Esta cuota no puede reportarse en su estado actual.');
    }

    await this.validarSecuenciaPago(cuota);
    this.validarMetodoPago(dto.metodoPago, cuota.ciclo.sociedad.tipoPago);

    if (cuota.ciclo.sociedad.organizadorId === usuarioId) {
      return this.pagosRepository.confirmarPagoPropioOrganizador(
        dto.cuotaPagoId,
        usuarioId,
        dto.metodoPago,
        dto.observacion?.trim(),
      );
    }

    const fechaInicio = new Date();
    const cuotaReportada = await this.pagosRepository.reportar(dto.cuotaPagoId, usuarioId, dto.metodoPago, dto.observacion?.trim());
    await this.notificacionesService.enviarUltimaParaUsuario(cuotaReportada.ciclo.sociedad.organizadorId, fechaInicio);
    return cuotaReportada;
  }

  async confirmar(usuarioId: string, cuotaPagoId: string) {
    const cuota = await this.validarCuota(cuotaPagoId);
    this.validarOrganizador(usuarioId, cuota.ciclo.sociedad.organizadorId);

    if (cuota.estado !== EstadoPago.REPORTADO) {
      throw new BadRequestException('Solo se pueden confirmar pagos reportados.');
    }

    this.validarSociedadOperativa(cuota.ciclo.sociedad.estado);

    const requiereEvidencia = cuota.metodoPagoReportado !== TipoPago.EFECTIVO;

    if (requiereEvidencia && cuota.evidencias.length === 0) {
      throw new BadRequestException('Debes revisar al menos un comprobante antes de confirmar este pago.');
    }

    const fechaInicio = new Date();
    const cuotaConfirmada = await this.pagosRepository.confirmar(cuotaPagoId, usuarioId);
    await this.notificacionesService.enviarUltimaParaUsuario(cuotaConfirmada.participante.usuarioId, fechaInicio);
    return cuotaConfirmada;
  }

  async rechazar(usuarioId: string, cuotaPagoId: string, observacion: string) {
    const cuota = await this.validarCuota(cuotaPagoId);
    this.validarOrganizador(usuarioId, cuota.ciclo.sociedad.organizadorId);

    if (cuota.estado !== EstadoPago.REPORTADO) {
      throw new BadRequestException('Solo se pueden rechazar pagos reportados.');
    }

    this.validarSociedadOperativa(cuota.ciclo.sociedad.estado);

    const fechaInicio = new Date();
    const cuotaRechazada = await this.pagosRepository.rechazar(cuotaPagoId, usuarioId, observacion.trim());
    await this.notificacionesService.enviarUltimaParaUsuario(cuotaRechazada.participante.usuarioId, fechaInicio);
    return cuotaRechazada;
  }

  private async validarCuota(cuotaPagoId: string) {
    const cuota = await this.pagosRepository.buscarCuota(cuotaPagoId);

    if (!cuota) {
      throw new NotFoundException('No encontramos esa cuota.');
    }

    return cuota;
  }

  private validarOrganizador(usuarioId: string, organizadorId: string) {
    if (usuarioId !== organizadorId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }
  }

  private validarMetodoPago(metodoPago: TipoPago, tipoPagoSociedad: TipoPago) {
    if (!METODOS_REPORTABLES.includes(metodoPago)) {
      throw new BadRequestException('Debes elegir efectivo, deposito bancario o transferencia.');
    }

    if (tipoPagoSociedad !== TipoPago.MIXTO && metodoPago !== tipoPagoSociedad) {
      throw new BadRequestException('Ese metodo de pago no esta permitido en esta sociedad.');
    }
  }

  private validarSociedadOperativa(estado: EstadoSociedad) {
    if (estado === EstadoSociedad.CANCELADA || estado === EstadoSociedad.FINALIZADA) {
      throw new BadRequestException('La sociedad esta cerrada y no permite operar pagos.');
    }
  }

  private async validarSecuenciaPago(cuota: {
    cicloId: string;
    participanteId: string;
    numeroCuota: number;
  }) {
    if (cuota.numeroCuota <= 1) {
      return;
    }

    const cuotaAnterior = await this.pagosRepository.buscarCuotaAnterior(
      cuota.cicloId,
      cuota.participanteId,
      cuota.numeroCuota - 1,
    );
    const estadosPreviosValidos: EstadoPago[] = [EstadoPago.REPORTADO, EstadoPago.CONFIRMADO];

    if (!cuotaAnterior || !estadosPreviosValidos.includes(cuotaAnterior.estado)) {
      throw new BadRequestException(`Debes hacer primero la cuota #${cuota.numeroCuota - 1}.`);
    }
  }
}
