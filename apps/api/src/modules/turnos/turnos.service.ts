import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCiclo, EstadoTurno, FrecuenciaSociedad, Prisma } from '@prisma/client';
import { TurnosManualesDto } from './dto/turnos-manuales.dto';
import { TurnosRepository } from './turnos.repository';

@Injectable()
export class TurnosService {
  constructor(private readonly turnosRepository: TurnosRepository) {}

  async listar(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarAcceso(usuarioId, cicloId);
    const turnos = await this.turnosRepository.listar(ciclo.id);
    return turnos.map((turno) => ({
      id: turno.id,
      numeroTurno: turno.numeroTurno,
      fechaProgramada: turno.fechaProgramada,
      montoCobro: Number(turno.montoCobro),
      estado: turno.estado,
      fechaEntrega: turno.fechaEntrega,
      entregadoPor: turno.entregadoPor,
      participante: turno.participante.usuario,
    }));
  }

  async generarAleatorios(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarOrganizadorEnConfiguracion(usuarioId, cicloId);
    const participantes = await this.turnosRepository.listarParticipantesActivos(ciclo.sociedadId);
    const mezclados = [...participantes].sort(() => Math.random() - 0.5);
    const montoEntrega = this.calcularMontoEntrega(ciclo.sociedad.montoCuota, participantes.length);
    const turnos = mezclados.map((participante, index) => ({
      participanteId: participante.id,
      numeroTurno: index + 1,
      fechaProgramada: this.calcularFecha(ciclo.fechaInicio, ciclo.sociedad.frecuencia, index),
      montoCobro: montoEntrega,
    }));

    return this.turnosRepository.guardarTurnos(ciclo.id, ciclo.sociedadId, usuarioId, turnos);
  }

  async registrarEntrega(usuarioId: string, cicloId: string, turnoId: string) {
    const ciclo = await this.validarAcceso(usuarioId, cicloId);

    if (ciclo.sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('Solo el organizador puede registrar entregas de turno.');
    }

    if (ciclo.estado !== EstadoCiclo.ACTIVO) {
      throw new BadRequestException('Solo se pueden registrar entregas en ciclos activos.');
    }

    const turno = await this.turnosRepository.buscarTurno(turnoId);

    if (!turno || turno.cicloId !== cicloId) {
      throw new NotFoundException('No encontramos ese turno.');
    }

    if (turno.estado === EstadoTurno.PAGADO) {
      throw new BadRequestException('Este turno ya fue registrado como entregado.');
    }

    const entregado = await this.turnosRepository.registrarEntrega(turnoId, usuarioId);
    return this.mapearTurno(entregado);
  }

  private mapearTurno(turno: {
    id: string;
    numeroTurno: number;
    fechaProgramada: Date;
    montoCobro: Prisma.Decimal;
    estado: string;
    fechaEntrega: Date | null;
    entregadoPor: string | null;
    participante: {
      usuario: {
        id: string;
        nombres: string;
        apellidos: string;
        telefono: string;
        email: string;
      };
    };
  }) {
    return {
      id: turno.id,
      numeroTurno: turno.numeroTurno,
      fechaProgramada: turno.fechaProgramada,
      montoCobro: Number(turno.montoCobro),
      estado: turno.estado,
      fechaEntrega: turno.fechaEntrega,
      entregadoPor: turno.entregadoPor,
      participante: turno.participante.usuario,
    };
  }

  async generarManuales(usuarioId: string, cicloId: string, dto: TurnosManualesDto) {
    const ciclo = await this.validarOrganizadorEnConfiguracion(usuarioId, cicloId);
    const participantes = await this.turnosRepository.listarParticipantesActivos(ciclo.sociedadId);
    const participantesValidos = new Set(participantes.map((participante) => participante.id));
    const numeros = new Set(dto.turnos.map((turno) => turno.numeroTurno));

    if (dto.turnos.length !== participantes.length || numeros.size !== participantes.length) {
      throw new BadRequestException('Debe definir un turno unico para cada participante activo.');
    }

    for (const turno of dto.turnos) {
      if (!participantesValidos.has(turno.participanteId)) {
        throw new BadRequestException('Uno de los participantes no pertenece a la sociedad.');
      }
    }

    const turnos = dto.turnos.map((turno) => ({
      participanteId: turno.participanteId,
      numeroTurno: turno.numeroTurno,
      fechaProgramada: this.calcularFecha(ciclo.fechaInicio, ciclo.sociedad.frecuencia, turno.numeroTurno - 1),
      montoCobro: this.calcularMontoEntrega(ciclo.sociedad.montoCuota, participantes.length),
    }));

    return this.turnosRepository.guardarTurnos(ciclo.id, ciclo.sociedadId, usuarioId, turnos);
  }

  private async validarAcceso(usuarioId: string, cicloId: string) {
    const ciclo = await this.turnosRepository.buscarCiclo(cicloId);

    if (!ciclo) {
      throw new NotFoundException('No encontramos ese ciclo.');
    }

    if (ciclo.sociedad.organizadorId === usuarioId) {
      return ciclo;
    }

    const participantes = await this.turnosRepository.listarParticipantesActivos(ciclo.sociedadId);
    const participa = participantes.some((participante) => participante.usuarioId === usuarioId);

    if (!participa) {
      throw new ForbiddenException('No tienes permiso para ver estos turnos.');
    }

    return ciclo;
  }

  private async validarOrganizadorEnConfiguracion(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarAcceso(usuarioId, cicloId);

    if (ciclo.sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }

    if (ciclo.estado !== EstadoCiclo.CONFIGURACION) {
      throw new BadRequestException('Los turnos solo se pueden modificar antes de iniciar el ciclo.');
    }

    const participantes = await this.turnosRepository.listarParticipantesActivos(ciclo.sociedadId);

    if (participantes.length < 2) {
      throw new BadRequestException('Debe haber al menos 2 participantes activos.');
    }

    return ciclo;
  }

  private calcularFecha(inicio: Date, frecuencia: FrecuenciaSociedad, indice: number) {
    const fecha = new Date(inicio);
    const dias = frecuencia === FrecuenciaSociedad.SEMANAL ? 7 : frecuencia === FrecuenciaSociedad.QUINCENAL ? 15 : 30;
    fecha.setUTCDate(fecha.getUTCDate() + dias * indice);
    return fecha;
  }

  private calcularMontoEntrega(montoCuota: Prisma.Decimal, cantidadParticipantes: number) {
    return new Prisma.Decimal(montoCuota).mul(cantidadParticipantes);
  }
}
