import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoSociedad } from '@prisma/client';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { ReportarChatDto } from './dto/reportar-chat.dto';
import { ChatsRepository } from './chats.repository';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async listarConversaciones(usuarioId: string, sociedadId: string) {
    const { sociedad, participacionUsuario, esOrganizador } = await this.validarAccesoSociedad(usuarioId, sociedadId);

    if (this.estaCerrada(sociedad.estado)) {
      const conversaciones = esOrganizador
        ? await this.chatsRepository.listarConversaciones(sociedad.id)
        : await this.chatsRepository.listarConversaciones(sociedad.id, participacionUsuario!.id);
      return conversaciones.map((item) => this.mapearConversacion(item));
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
    const conversacion = this.estaCerrada(sociedad.estado)
      ? await this.chatsRepository.buscarConversacion(sociedad.id, participanteId)
      : await this.chatsRepository.buscarOCrearConversacion(sociedad.id, participanteId, sociedad.organizadorId);

    if (!conversacion) {
      return [];
    }

    const mensajes = await this.chatsRepository.listarMensajes(conversacion.id);
    return mensajes.map((mensaje) => this.mapearMensaje(mensaje));
  }

  async enviarMensaje(usuarioId: string, sociedadId: string, participanteId: string, dto: EnviarMensajeDto) {
    const { sociedad, participante } = await this.validarAccesoChat(usuarioId, sociedadId, participanteId);
    const texto = dto.mensaje.trim();

    if (this.estaCerrada(sociedad.estado)) {
      throw new BadRequestException('El chat esta en modo lectura porque el san esta cerrado.');
    }

    if (!texto) {
      throw new BadRequestException('El mensaje no puede estar vacio.');
    }

    const conversacion = await this.chatsRepository.buscarOCrearConversacion(sociedad.id, participanteId, sociedad.organizadorId);
    const destinatarioId = usuarioId === sociedad.organizadorId ? participante.usuarioId : sociedad.organizadorId;
    const fechaInicio = new Date();
    const mensaje = await this.chatsRepository.enviarMensaje(conversacion.id, usuarioId, texto);
    await this.notificacionesService.enviarUltimaParaUsuario(destinatarioId, fechaInicio);
    return this.mapearMensaje(mensaje);
  }

  async reportar(usuarioId: string, sociedadId: string, participanteId: string, dto: ReportarChatDto) {
    const { sociedad, participante } = await this.validarAccesoChat(usuarioId, sociedadId, participanteId);
    const conversacion = await this.chatsRepository.buscarConversacion(sociedad.id, participanteId);

    if (!conversacion) {
      throw new NotFoundException('No encontramos esa conversacion.');
    }

    if (dto.mensajeId) {
      const mensaje = await this.chatsRepository.buscarMensajeEnConversacion(dto.mensajeId, conversacion.id);
      if (!mensaje) {
        throw new NotFoundException('El mensaje no pertenece a esta conversacion.');
      }
      if (mensaje.remitenteId === usuarioId) {
        throw new BadRequestException('No puedes reportar tu propio mensaje.');
      }
      if (await this.chatsRepository.buscarReporteMensaje(usuarioId, dto.mensajeId)) {
        throw new BadRequestException('Ya reportaste este mensaje.');
      }
    }

    const usuarioReportadoId = usuarioId === sociedad.organizadorId ? participante.usuarioId : sociedad.organizadorId;
    const reporte = await this.chatsRepository.crearReporte({
      reportanteUsuarioId: usuarioId,
      usuarioReportadoId,
      sociedadId,
      conversacionId: conversacion.id,
      mensajeId: dto.mensajeId,
      motivo: dto.motivo,
      descripcion: dto.descripcion?.trim() || undefined,
    });

    return { id: reporte.id, estado: reporte.estado, mensaje: 'Reporte enviado. Revisaremos la situacion.' };
  }

  private async validarAccesoChat(usuarioId: string, sociedadId: string, participanteId: string) {
    const contexto = await this.validarAccesoSociedad(usuarioId, sociedadId);

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
