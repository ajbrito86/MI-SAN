import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SubirEvidenciaDto } from './dto/subir-evidencia.dto';
import { UploadsRepository } from './uploads.repository';

const MIMES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

@Injectable()
export class UploadsService {
  constructor(private readonly uploadsRepository: UploadsRepository) {}

  async subirEvidencia(usuarioId: string, dto: SubirEvidenciaDto, archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('Debes adjuntar un comprobante.');
    }

    if (!MIMES_PERMITIDOS.has(archivo.mimetype)) {
      throw new BadRequestException('El archivo debe ser imagen JPG, PNG, WEBP o PDF.');
    }

    const cuota = await this.uploadsRepository.buscarCuota(dto.cuotaPagoId);

    if (!cuota) {
      throw new NotFoundException('No encontramos esa cuota.');
    }

    const esParticipante = cuota.participante.usuarioId === usuarioId;
    const esOrganizador = cuota.ciclo.sociedad.organizadorId === usuarioId;

    if (!esParticipante && !esOrganizador) {
      throw new ForbiddenException('No tienes permiso para cargar evidencias en esta cuota.');
    }

    return this.uploadsRepository.crearEvidencia({
      cuotaPagoId: dto.cuotaPagoId,
      urlArchivo: `/uploads/evidences/${archivo.filename}`,
      nombreArchivo: archivo.originalname,
      mimeType: archivo.mimetype,
      cargadoPor: usuarioId,
      sociedadId: cuota.ciclo.sociedadId,
    });
  }
}
