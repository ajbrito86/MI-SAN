import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { ComprarPremiumDto } from './dto/comprar-premium.dto';
import { SuscripcionesService } from './suscripciones.service';

@UseGuards(JwtAuthGuard)
@Controller('suscripciones')
export class SuscripcionesController {
  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  @Get('actual')
  obtenerActual(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.suscripcionesService.obtenerActual(usuario.id);
  }

  @Get('historial')
  listarHistorial(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.suscripcionesService.listarHistorial(usuario.id);
  }

  @Post('comprar')
  comprarPremium(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: ComprarPremiumDto) {
    return this.suscripcionesService.comprarPremium(usuario.id, dto);
  }

  @Post('restaurar')
  restaurarCompra(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: ComprarPremiumDto) {
    return this.suscripcionesService.restaurarCompra(usuario.id, dto);
  }
}
