import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { AnaliticasService } from './analiticas.service';
import { RegistrarEventoDto } from './dto/registrar-evento.dto';

@UseGuards(JwtAuthGuard)
@Controller('analiticas')
export class AnaliticasController {
  constructor(private readonly analiticasService: AnaliticasService) {}

  @Post('eventos')
  registrarEvento(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: RegistrarEventoDto) {
    return this.analiticasService.registrarEvento(usuario.id, dto);
  }
}
