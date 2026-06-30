import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { SubirEvidenciaDto } from './dto/subir-evidencia.dto';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('evidence')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const destino = 'uploads/evidences';
          mkdirSync(destino, { recursive: true });
          callback(null, destino);
        },
        filename: (_req, file, callback) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, nombre);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  subirEvidencia(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: SubirEvidenciaDto,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.uploadsService.subirEvidencia(usuario.id, dto, archivo);
  }
}
