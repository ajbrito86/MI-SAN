import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoSociedad } from '@prisma/client';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { ChatsRepository } from './chats.repository';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async listarConversaciones(usuarioId: string, sociedadId: string) {
    const { sociedad, participacionUsuario, esOrganizador } = await this.validarAccesoSociedad(usuarioId, sociedadId);

    if (this.estaCerrada(sociedad.estado)) {
      return [];
    }

    if (!esOrganizador) {
      const conversacion = await this.chatsRepository.buscarOCrearConversacion(
        sociedad.id,
        participacionUsuario!.id,
        sociedad.organizadorId,
      );
      const conversaciones = await this.chatsRepository.listarConversaciones(sociedad.id, conversacion.participanteId);
      return conversaciones.map((item) => this.mapearConversacion(item));
    }

    await Promise.all(
      sociedad.participantes
        .filter((participante) => participante.usuarioId !== sociedad.organizadorId)
        .map((participante) =>
          this.chatsRepository.buscarOCrearConversacion(sociedad.id, participante.id, sociedad.organizadorId),
        ),
    );
    const conversaciones = await this.chatsRepository.listarConversaciones(sociedad.id);
    return conversaciones.map((item) => this.mapearConversacion(item));
  }

  async listarMensajes(usuarioId: string, sociedadId: string, participanteId: string) {
    const { sociedad } = await this.validarAccesoChat(usuarioId, sociedadId, participanteId);
    const conversacion = await this.chatsRepository.buscarOCrearConversacion(sociedad.id, participanteId, sociedad.organizadorId);
    const mensajes = await this.chatsRepository.listarMensajes(conversacion.id);
    return mensajes.map((mensaje) => this.mapearMensaje(mensaje));
  }

  async enviarMensaje(usuarioId: string, sociedadId: string, participanteId: string, dto: EnviarMensajeDto) {
    const { sociedad } = await this.validarAccesoChat(usuarioId, sociedadId, participanteId);
    const texto = dto.mensaje.trim();

    if (!texto) {
      throw new BadRequestException('El mensaje no puede estar vacio.');
    }

    const conversacion = await this.chatsRepository.buscarOCrearConversacion(sociedad.id, participanteId, sociedad.organizadorId);
    const mensaje = await this.chatsRepository.enviarMensaje(conversacion.id, usuarioId, texto);
    return this.mapearMensaje(mensaje);
  }

  private async validarAccesoChat(usuarioId: string, sociedadId: string, participanteId: string) {
    const contexto = await this.validarAccesoSociedad(usuarioId, sociedadId);

    if (this.estaCerrada(contexto.sociedad.estado)) {
      throw new BadRequestException('El chat no esta disponible cuando el san ya finalizo o fue cancelado.');
    }

    const participante = await this.chatsRepository.buscarParticipacion(participanteId, sociedadId);

    if (!participante) {
      throw new NotFoundException('No encontramos ese participante activo en este san.');
    }

    if (contexto.esOrganizador && participante.usuarioId === contexto.sociedad.organizadorId) {
      throw new BadRequestException('El organizador no puede abrir un chat consigo mismo.');
    }

    if (!contexto.esOrganizador && contexto.participacionUsuario?.id !== participanteId) {
      throw new ForbiddenException('Solo puedes ver tu chat privado con el organizador.');
    }

    return { ...contexto, participante };
  }

  private async validarAccesoSociedad(usuarioId: string, sociedadId: string) {
    const sociedad = await this.chatsRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    const esOrganizador = sociedad.organizadorId === usuarioId;
    const participacionUsuario = esOrganizador
      ? null
      : await this.chatsRepository.buscarParticipacionUsuario(usuarioId, sociedadId);

    if (!esOrganizador && !participacionUsuario) {
      throw new ForbiddenException('No tienes permiso para ver este chat.');
    }

    return { sociedad, esOrganizador, participacionUsuario };
  }

  private estaCerrada(estado: EstadoSociedad) {
    return estado === EstadoSociedad.FINALIZADA || estado === EstadoSociedad.CANCELADA;
  }

  private mapearConversacion(conversacion: {
    id: string;
    participanteId: string;
    participante: {
      usuario: {
        id: string;
        nombres: string;
        apellidos: string;
        email: string;
        telefono: string;
      };
    };
    mensajes: {
      id: string;
      mensaje: string;
      createdAt: Date;
      remitente: { id: string; nombres: string; apellidos: string };
    }[];
    updatedAt: Date;
  }) {
    const ultimoMensaje = conversacion.mensajes[0] ?? null;

    return {
      id: conversacion.id,
      participanteId: conversacion.participanteId,
      participante: conversacion.participante.usuario,
      ultimoMensaje: ultimoMensaje
        ? {
            id: ultimoMensaje.id,
            mensaje: ultimoMensaje.mensaje,
            createdAt: ultimoMensaje.createdAt,
            remitente: ultimoMensaje.remitente,
          }
        : null,
      updatedAt: conversacion.updatedAt,
    };
  }

  private mapearMensaje(mensaje: {
    id: string;
    mensaje: string;
    createdAt: Date;
    leido: boolean;
    remitente: { id: string; nombres: string; apellidos: string };
  }) {
    return {
      id: mensaje.id,
      mensaje: mensaje.mensaje,
      createdAt: mensaje.createdAt,
      leido: mensaje.leido,
      remitente: mensaje.remitente,
    };
  }
}
