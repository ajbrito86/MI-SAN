import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoInvitacion, EstadoSociedad } from '@prisma/client';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';
import { ParticipantesRepository } from './participantes.repository';

@Injectable()
export class ParticipantesService {
  constructor(private readonly participantesRepository: ParticipantesRepository) {}

  async crearInvitacion(usuarioId: string, sociedadId: string, dto: CrearInvitacionDto) {
    const sociedad = await this.validarOrganizador(usuarioId, sociedadId);

    if (sociedad.estado !== EstadoSociedad.CONFIGURACION) {
      throw new BadRequestException('Este san ya inicio y esta cerrado para nuevos invitados.');
    }

    if (!dto.emailInvitado && !dto.telefonoInvitado) {
      throw new BadRequestException('Debes indicar telefono o correo del invitado.');
    }

    const usuarioInvitado = await this.participantesRepository.buscarUsuarioPorInvitacion(dto);

    if (!usuarioInvitado) {
      throw new NotFoundException('No encontramos un usuario registrado con ese telefono o correo.');
    }

    const yaParticipa = await this.participantesRepository.buscarAcceso(usuarioInvitado.id, sociedad.id);

    if (yaParticipa) {
      throw new BadRequestException('Ese usuario ya pertenece a la sociedad.');
    }

    return this.participantesRepository.crearInvitacion(sociedadId, usuarioId, dto);
  }

  async listarMisInvitaciones(usuarioId: string) {
    const usuario = await this.participantesRepository.buscarUsuario(usuarioId);

    if (!usuario) {
      throw new NotFoundException('No encontramos tu perfil.');
    }

    const invitaciones = await this.participantesRepository.listarInvitacionesDelUsuario(usuario.email, usuario.telefono);

    return invitaciones.map((invitacion) => ({
      id: invitacion.id,
      estado: invitacion.estado,
      createdAt: invitacion.createdAt,
      sociedad: {
        ...invitacion.sociedad,
        montoCuota: Number(invitacion.sociedad.montoCuota),
      },
    }));
  }

  async listarParticipantes(usuarioId: string, sociedadId: string) {
    await this.validarAcceso(usuarioId, sociedadId);
    const participantes = await this.participantesRepository.listarParticipantes(sociedadId);

    return participantes.map((participante) => ({
      id: participante.id,
      turno: participante.turno,
      estadoParticipante: participante.estadoParticipante,
      observacion: participante.observacion,
      usuario: participante.usuario,
    }));
  }

  async aceptarInvitacion(usuarioId: string, invitacionId: string) {
    const invitacion = await this.validarInvitacionParaUsuario(usuarioId, invitacionId);

    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      throw new BadRequestException('La invitacion ya fue respondida.');
    }

    if (invitacion.sociedad.estado !== EstadoSociedad.CONFIGURACION) {
      throw new BadRequestException('Este san ya inicio. Podras participar en un proximo ciclo o en otro san.');
    }

    return this.participantesRepository.aceptarInvitacion(invitacionId, usuarioId, invitacion.sociedadId);
  }

  async rechazarInvitacion(usuarioId: string, invitacionId: string) {
    const invitacion = await this.validarInvitacionParaUsuario(usuarioId, invitacionId);

    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      throw new BadRequestException('La invitacion ya fue respondida.');
    }

    return this.participantesRepository.rechazarInvitacion(invitacionId);
  }

  async expulsarParticipante(usuarioId: string, participanteId: string, motivo: string) {
    const participante = await this.participantesRepository.buscarParticipante(participanteId);

    if (!participante) {
      throw new NotFoundException('No encontramos ese participante.');
    }

    await this.validarOrganizador(usuarioId, participante.sociedadId);

    if (participante.sociedad.estado !== EstadoSociedad.CONFIGURACION) {
      throw new BadRequestException('No se pueden expulsar participantes despues de iniciar el san.');
    }

    if (participante.usuarioId === usuarioId) {
      throw new BadRequestException('El organizador no puede expulsarse a si mismo.');
    }

    return this.participantesRepository.expulsarParticipante(participanteId, usuarioId, motivo.trim());
  }

  private async validarOrganizador(usuarioId: string, sociedadId: string) {
    const sociedad = await this.participantesRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }

    return sociedad;
  }

  private async validarAcceso(usuarioId: string, sociedadId: string) {
    const sociedad = await this.participantesRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId === usuarioId) {
      return;
    }

    const acceso = await this.participantesRepository.buscarAcceso(usuarioId, sociedadId);

    if (!acceso) {
      throw new ForbiddenException('No tienes permiso para ver esta sociedad.');
    }
  }

  private async validarInvitacionParaUsuario(usuarioId: string, invitacionId: string) {
    const [usuario, invitacion] = await Promise.all([
      this.participantesRepository.buscarUsuario(usuarioId),
      this.participantesRepository.buscarInvitacion(invitacionId),
    ]);

    if (!usuario || !invitacion) {
      throw new NotFoundException('No encontramos esa invitacion.');
    }

    const coincideEmail = invitacion.emailInvitado?.toLowerCase() === usuario.email.toLowerCase();
    const coincideTelefono = invitacion.telefonoInvitado === usuario.telefono;

    if (!coincideEmail && !coincideTelefono) {
      throw new ForbiddenException('No tienes permiso para responder esta invitacion.');
    }

    return invitacion;
  }
}
