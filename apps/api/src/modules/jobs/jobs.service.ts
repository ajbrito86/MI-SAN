import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EstadoPago, TipoNotificacion } from '@prisma/client';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async marcarPagosAtrasados() {
    const ahora = new Date();
    const cuotas = await this.prisma.cuotaPago.findMany({
      where: {
        fechaVencimiento: { lt: ahora },
        estado: EstadoPago.PENDIENTE,
      },
      include: {
        participante: true,
        ciclo: { include: { sociedad: true } },
      },
    });

    if (cuotas.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      cuotas.map((cuota) =>
        this.prisma.cuotaPago.update({
          where: { id: cuota.id },
          data: { estado: EstadoPago.ATRASADO },
        }),
      ),
    );

    const notificaciones = await this.prisma.$transaction(
      cuotas.map((cuota) =>
        this.prisma.notificacion.create({
          data: {
            usuarioId: cuota.participante.usuarioId,
            titulo: 'Pago atrasado',
            mensaje: `La cuota #${cuota.numeroCuota} del ciclo #${cuota.ciclo.numeroCiclo} de ${cuota.ciclo.sociedad.nombre} esta atrasada.`,
            tipo: TipoNotificacion.PROXIMO_VENCIMIENTO,
            metadataJson: {
              sociedadId: cuota.ciclo.sociedadId,
              cicloId: cuota.cicloId,
              cuotaPagoId: cuota.id,
              destino: 'PAGOS',
            },
          },
        }),
      ),
    );

    await this.notificacionesService.enviarPush(notificaciones);

    this.logger.warn(`Cuotas marcadas como atrasadas: ${cuotas.length}`);
  }
}
