import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificacionesRepository, type NotificacionParaPush } from './notificaciones.repository';

type PushMessage = {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

  listar(usuarioId: string) {
    return this.notificacionesRepository.listar(usuarioId);
  }

  async contarNoLeidas(usuarioId: string) {
    const cantidad = await this.notificacionesRepository.contarNoLeidas(usuarioId);
    return { cantidad };
  }

  async marcarLeida(usuarioId: string, notificacionId: string) {
    const notificacion = await this.notificacionesRepository.buscar(notificacionId);

    if (!notificacion) {
      throw new NotFoundException('No encontramos esa notificacion.');
    }

    if (notificacion.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para leer esa notificacion.');
    }

    return this.notificacionesRepository.marcarLeida(notificacionId);
  }

  marcarTodasLeidas(usuarioId: string) {
    return this.notificacionesRepository.marcarTodasLeidas(usuarioId);
  }

  async registrarPushToken(usuarioId: string, pushToken: string) {
    if (!this.esExpoPushToken(pushToken)) {
      throw new BadRequestException('Token de notificaciones invalido.');
    }

    await this.notificacionesRepository.actualizarPushToken(usuarioId, pushToken);
    await this.notificacionesRepository.actualizarPreferencia(usuarioId, true);
    return { mensaje: 'Notificaciones push activadas correctamente.' };
  }

  async eliminarPushToken(usuarioId: string) {
    await this.notificacionesRepository.actualizarPushToken(usuarioId, null);
    return { mensaje: 'Notificaciones push desactivadas correctamente.' };
  }

  async obtenerPreferencia(usuarioId: string) {
    const preferencia = await this.notificacionesRepository.obtenerPreferencia(usuarioId);
    return { habilitadas: preferencia.notificacionesHabilitadas, tokenRegistrado: Boolean(preferencia.pushToken) };
  }

  async actualizarPreferencia(usuarioId: string, habilitadas: boolean) {
    const preferencia = await this.notificacionesRepository.actualizarPreferencia(usuarioId, habilitadas);
    return { habilitadas: preferencia.notificacionesHabilitadas, tokenRegistrado: Boolean(preferencia.pushToken) };
  }

  async enviarUltimaParaUsuario(usuarioId: string, createdAtGte: Date) {
    const notificacion = await this.notificacionesRepository.buscarUltimaParaUsuario(usuarioId, createdAtGte);

    if (!notificacion) {
      return;
    }

    await this.enviarPush([notificacion]);
  }

  async enviarPush(notificaciones: NotificacionParaPush[]) {
    if (notificaciones.length === 0) {
      return;
    }

    const usuarios = await this.notificacionesRepository.listarPushTokens(notificaciones.map((notificacion) => notificacion.usuarioId));
    const tokensPorUsuario = new Map(usuarios.map((usuario) => [usuario.id, usuario.pushToken]));
    const mensajes = notificaciones
      .map((notificacion): PushMessage | null => {
        const pushToken = tokensPorUsuario.get(notificacion.usuarioId);

        if (!pushToken || !this.esExpoPushToken(pushToken)) {
          return null;
        }

        return {
          to: pushToken,
          sound: 'default',
          title: notificacion.titulo,
          body: notificacion.mensaje,
          data: {
            notificacionId: notificacion.id,
            tipo: notificacion.tipo,
            metadata: notificacion.metadataJson,
          },
        } satisfies PushMessage;
      })
      .filter((mensaje): mensaje is PushMessage => mensaje !== null);

    if (mensajes.length === 0) {
      return;
    }

    for (let index = 0; index < mensajes.length; index += 100) {
      const lote = mensajes.slice(index, index + 100);

      try {
        const response = await fetch(this.expoPushUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lote),
        });

        if (!response.ok) {
          this.logger.warn(`Expo Push respondio ${response.status}.`);
          continue;
        }

        const resultado = (await response.json().catch(() => null)) as { data?: ExpoPushTicket[] } | null;
        const tokensInvalidos = (resultado?.data ?? [])
          .map((ticket, indice) => (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' ? lote[indice]?.to : null))
          .filter((token): token is string => Boolean(token));

        if (tokensInvalidos.length > 0) {
          await this.notificacionesRepository.limpiarPushTokens(tokensInvalidos);
        }
      } catch (error) {
        this.logger.warn(`No pudimos enviar push: ${error instanceof Error ? error.message : 'error desconocido'}`);
      }
    }
  }

  private esExpoPushToken(pushToken: string) {
    return /^Expo(nent)?PushToken\[[\w-]+\]$/.test(pushToken);
  }
}
