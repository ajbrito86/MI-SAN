import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HistorialRepository } from './historial.repository';

@Injectable()
export class HistorialService {
  constructor(private readonly historialRepository: HistorialRepository) {}

  async listar(usuarioId: string, sociedadId: string) {
    const sociedad = await this.historialRepository.buscarSociedad(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId !== usuarioId) {
      const participacion = await this.historialRepository.buscarParticipacion(usuarioId, sociedadId);

      if (!participacion) {
        throw new ForbiddenException('No tienes permiso para ver este historial.');
      }
    }

    return this.historialRepository.listar(sociedadId);
  }
}
