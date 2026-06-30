import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificacionesRepository } from './notificaciones.repository';

@Injectable()
export class NotificacionesService {
  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

  listar(usuarioId: string) {
    return this.notificacionesRepository.listar(usuarioId);
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
}
