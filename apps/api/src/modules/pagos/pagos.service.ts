import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCiclo, EstadoPago, TipoPago } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';
import { ReportarPagoDto } from './dto/reportar-pago.dto';
import { PagosRepository } from './pagos.repository';

const METODOS_REPORTABLES: TipoPago[] = [TipoPago.EFECTIVO, TipoPago.DEPOSITO_BANCARIO, TipoPago.TRANSFERENCIA];

@Injectable()
export class PagosService {
  constructor(
    private readonly pagosRepository: PagosRepository,
    private readonly jobsService: JobsService,
  ) {}

  async listarMisPagos(usuarioId: string) {
    await this.jobsService.marcarPagosAtrasados();
    const pagos = await this.pagosRepository.listarMisPagos(usuarioId);
    return pagos.map((pago) => ({
      id: pago.id,
      sociedad: pago.ciclo.sociedad,
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

    const estadosReportables: EstadoPago[] = [EstadoPago.PENDIENTE, EstadoPago.ATRASADO, EstadoPago.RECHAZADO];

    if (!estadosReportables.includes(cuota.estado)) {
      throw new BadRequestException('Esta cuota no puede reportarse en su estado actual.');
    }

    this.validarMetodoPago(dto.metodoPago, cuota.ciclo.sociedad.tipoPago);

    return this.pagosRepository.reportar(dto.cuotaPagoId, usuarioId, dto.metodoPago, dto.observacion?.trim());
  }

  async confirmar(usuarioId: string, cuotaPagoId: string) {
    const cuota = await this.validarCuota(cuotaPagoId);
    this.validarOrganizador(usuarioId, cuota.ciclo.sociedad.organizadorId);

    if (cuota.estado !== EstadoPago.REPORTADO) {
      throw new BadRequestException('Solo se pueden confirmar pagos reportados.');
    }

    const requiereEvidencia = cuota.metodoPagoReportado !== TipoPago.EFECTIVO;

    if (requiereEvidencia && cuota.evidencias.length === 0) {
      throw new BadRequestException('Debes revisar al menos un comprobante antes de confirmar este pago.');
    }

    return this.pagosRepository.confirmar(cuotaPagoId, usuarioId);
  }

  async rechazar(usuarioId: string, cuotaPagoId: string, observacion: string) {
    const cuota = await this.validarCuota(cuotaPagoId);
    this.validarOrganizador(usuarioId, cuota.ciclo.sociedad.organizadorId);

    if (cuota.estado !== EstadoPago.REPORTADO) {
      throw new BadRequestException('Solo se pueden rechazar pagos reportados.');
    }

    return this.pagosRepository.rechazar(cuotaPagoId, usuarioId, observacion.trim());
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
}
