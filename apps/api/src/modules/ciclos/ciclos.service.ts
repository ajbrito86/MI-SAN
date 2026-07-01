import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCiclo, EstadoSociedad, FrecuenciaSociedad } from '@prisma/client';
import { CiclosRepository } from './ciclos.repository';
import { CrearCicloDto } from './dto/crear-ciclo.dto';

@Injectable()
export class CiclosService {
  constructor(private readonly ciclosRepository: CiclosRepository) {}

  async crear(usuarioId: string, sociedadId: string, dto: CrearCicloDto) {
    const sociedad = await this.validarOrganizador(usuarioId, sociedadId);

    if (sociedad.estado === EstadoSociedad.CANCELADA || sociedad.estado === EstadoSociedad.FINALIZADA) {
      throw new BadRequestException('La sociedad esta cerrada y no puede crear ciclos.');
    }

    if (sociedad.participantes.length < 2) {
      throw new BadRequestException('Una sociedad debe tener al menos 2 participantes activos.');
    }

    const ultimoCiclo = sociedad.ciclos[0] ?? null;

    if (ultimoCiclo && ultimoCiclo.estado !== EstadoCiclo.COMPLETADO && ultimoCiclo.estado !== EstadoCiclo.CANCELADO) {
      throw new BadRequestException('Debe finalizar el ciclo actual antes de crear uno nuevo.');
    }

    if (dto.fechaInicio && this.esFechaPasada(dto.fechaInicio)) {
      throw new BadRequestException('La fecha de inicio del nuevo ciclo no puede estar en el pasado.');
    }

    const numeroCiclo = (sociedad.ciclos[0]?.numeroCiclo ?? 0) + 1;
    const fechaInicio = dto.fechaInicio ?? this.calcularFechaInicioSugerida(sociedad.fechaInicio, sociedad.frecuencia, sociedad.ciclos[0] ?? null);
    return this.ciclosRepository.crear(sociedadId, usuarioId, numeroCiclo, fechaInicio);
  }

  async iniciar(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarCicloOrganizador(usuarioId, cicloId);
    const participantesActivos = await this.ciclosRepository.listarParticipantesActivos(ciclo.sociedadId);

    this.validarSociedadOperativa(ciclo.sociedad.estado);

    if (ciclo.estado !== EstadoCiclo.CONFIGURACION) {
      throw new BadRequestException('El ciclo ya fue iniciado o cerrado.');
    }

    if (participantesActivos.length < 2) {
      throw new BadRequestException('Debe haber al menos 2 participantes activos para iniciar el ciclo.');
    }

    if (ciclo.turnos.length !== participantesActivos.length) {
      throw new BadRequestException('Debe existir un turno para cada participante activo antes de iniciar.');
    }

    const fechaInicioOperativa = this.esFechaPasada(ciclo.fechaInicio) ? this.inicioUtcHoy() : undefined;
    return this.ciclosRepository.iniciar(cicloId, usuarioId, fechaInicioOperativa);
  }

  async finalizar(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarCicloOrganizador(usuarioId, cicloId);

    this.validarSociedadOperativa(ciclo.sociedad.estado);

    if (ciclo.estado !== EstadoCiclo.ACTIVO) {
      throw new BadRequestException('Solo un ciclo activo puede finalizarse.');
    }

    if (ciclo.turnos.length === 0 || ciclo.turnos.some((turno) => turno.estado !== 'PAGADO')) {
      throw new BadRequestException('Debe registrar todas las entregas antes de finalizar el ciclo.');
    }

    return this.ciclosRepository.finalizar(cicloId, usuarioId);
  }

  private async validarOrganizador(usuarioId: string, sociedadId: string) {
    const sociedad = await this.ciclosRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }

    return sociedad;
  }

  private async validarCicloOrganizador(usuarioId: string, cicloId: string) {
    const ciclo = await this.ciclosRepository.buscarCiclo(cicloId);

    if (!ciclo) {
      throw new NotFoundException('No encontramos ese ciclo.');
    }

    if (ciclo.sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }

    return ciclo;
  }

  private validarSociedadOperativa(estado: EstadoSociedad) {
    if (estado === EstadoSociedad.CANCELADA || estado === EstadoSociedad.FINALIZADA) {
      throw new BadRequestException('La sociedad esta cerrada y no permite operar ciclos.');
    }
  }

  private calcularFechaInicioSugerida(
    fechaInicioSociedad: Date,
    frecuencia: FrecuenciaSociedad,
    ultimoCiclo: {
      fechaInicio: Date;
      turnos: { fechaProgramada: Date }[];
    } | null,
  ) {
    if (!ultimoCiclo) {
      return this.fechaNoPasada(fechaInicioSociedad);
    }

    const ultimaFechaTurno = ultimoCiclo.turnos[0]?.fechaProgramada ?? ultimoCiclo.fechaInicio;
    return this.fechaNoPasada(this.sumarPeriodo(ultimaFechaTurno, frecuencia, 1));
  }

  private fechaNoPasada(fecha: Date) {
    return this.esFechaPasada(fecha) ? this.inicioUtcHoy() : fecha;
  }

  private esFechaPasada(fecha: Date) {
    return this.inicioUtcDia(fecha).getTime() < this.inicioUtcHoy().getTime();
  }

  private inicioUtcHoy() {
    return this.inicioUtcDia(new Date());
  }

  private inicioUtcDia(fecha: Date) {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  }

  private sumarPeriodo(fecha: Date, frecuencia: FrecuenciaSociedad, cantidadPeriodos: number) {
    const siguiente = new Date(fecha);
    const dias = frecuencia === FrecuenciaSociedad.SEMANAL ? 7 : frecuencia === FrecuenciaSociedad.QUINCENAL ? 15 : 30;
    siguiente.setUTCDate(siguiente.getUTCDate() + dias * cantidadPeriodos);
    return siguiente;
  }
}
