import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';
import { ExpulsarParticipanteDto } from './dto/expulsar-participante.dto';
import { ParticipantesService } from './participantes.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ParticipantesController {
  constructor(private readonly participantesService: ParticipantesService) {}

  @Get('invitations/my')
  listarMisInvitaciones(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.participantesService.listarMisInvitaciones(usuario.id);
  }

  @Post('societies/:id/invitations')
  crearInvitacion(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') sociedadId: string,
    @Body() dto: CrearInvitacionDto,
  ) {
    return this.participantesService.crearInvitacion(usuario.id, sociedadId, dto);
  }

  @Get('societies/:id/participants')
  listarParticipantes(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.participantesService.listarParticipantes(usuario.id, sociedadId);
  }

  @Post('invitations/:id/accept')
  aceptarInvitacion(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') invitacionId: string) {
    return this.participantesService.aceptarInvitacion(usuario.id, invitacionId);
  }

  @Post('invitations/:id/reject')
  rechazarInvitacion(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') invitacionId: string) {
    return this.participantesService.rechazarInvitacion(usuario.id, invitacionId);
  }

  @Delete('participants/:id')
  expulsarParticipante(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') participanteId: string,
    @Body() dto: ExpulsarParticipanteDto,
  ) {
    return this.participantesService.expulsarParticipante(usuario.id, participanteId, dto.motivo);
  }
}
