import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCiclo, EstadoSociedad } from '@prisma/client';
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

    const numeroCiclo = (sociedad.ciclos[0]?.numeroCiclo ?? 0) + 1;
    return this.ciclosRepository.crear(sociedadId, usuarioId, numeroCiclo, dto.fechaInicio ?? sociedad.fechaInicio);
  }

  async iniciar(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarCicloOrganizador(usuarioId, cicloId);
    const participantesActivos = await this.ciclosRepository.listarParticipantesActivos(ciclo.sociedadId);

    if (ciclo.estado !== EstadoCiclo.CONFIGURACION) {
      throw new BadRequestException('El ciclo ya fue iniciado o cerrado.');
    }

    if (participantesActivos.length < 2) {
      throw new BadRequestException('Debe haber al menos 2 participantes activos para iniciar el ciclo.');
    }

    if (ciclo.turnos.length !== participantesActivos.length) {
      throw new BadRequestException('Debe existir un turno para cada participante activo antes de iniciar.');
    }

    return this.ciclosRepository.iniciar(cicloId, usuarioId);
  }

  async finalizar(usuarioId: string, cicloId: string) {
    const ciclo = await this.validarCicloOrganizador(usuarioId, cicloId);

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
}
