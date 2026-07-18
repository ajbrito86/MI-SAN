import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { ChatsService } from './chats.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { ReportarChatDto } from './dto/reportar-chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('societies/:id/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  listarConversaciones(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.chatsService.listarConversaciones(usuario.id, sociedadId);
  }

  @Get(':participanteId/messages')
  listarMensajes(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') sociedadId: string,
    @Param('participanteId') participanteId: string,
  ) {
    return this.chatsService.listarMensajes(usuario.id, sociedadId, participanteId);
  }

  @Post(':participanteId/messages')
  enviarMensaje(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') sociedadId: string,
    @Param('participanteId') participanteId: string,
    @Body() dto: EnviarMensajeDto,
  ) {
    return this.chatsService.enviarMensaje(usuario.id, sociedadId, participanteId, dto);
  }

  @Post(':participanteId/reports')
  reportar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') sociedadId: string,
    @Param('participanteId') participanteId: string,
    @Body() dto: ReportarChatDto,
  ) {
    return this.chatsService.reportar(usuario.id, sociedadId, participanteId, dto);
  }
}
