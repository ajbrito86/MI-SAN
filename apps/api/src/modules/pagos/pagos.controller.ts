import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { PagosService } from './pagos.service';
import { RechazarPagoDto } from './dto/rechazar-pago.dto';
import { ReportarPagoDto } from './dto/reportar-pago.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('report')
  reportar(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: ReportarPagoDto) {
    return this.pagosService.reportar(usuario.id, dto);
  }

  @Post(':id/confirm')
  confirmar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cuotaPagoId: string) {
    return this.pagosService.confirmar(usuario.id, cuotaPagoId);
  }

  @Post(':id/reject')
  rechazar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cuotaPagoId: string, @Body() dto: RechazarPagoDto) {
    return this.pagosService.rechazar(usuario.id, cuotaPagoId, dto.observacion);
  }

  @Get('my')
  listarMisPagos(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pagosService.listarMisPagos(usuario.id);
  }

  @Get('/society/:id')
  listarPagosSociedad(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.pagosService.listarPagosSociedad(usuario.id, sociedadId);
  }
}
