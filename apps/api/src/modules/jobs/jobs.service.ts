import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EstadoPago, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.notificacion.createMany({
      data: cuotas.map((cuota) => ({
        usuarioId: cuota.participante.usuarioId,
        titulo: 'Pago atrasado',
        mensaje: `La cuota #${cuota.numeroCuota} de ${cuota.ciclo.sociedad.nombre} esta atrasada.`,
        tipo: TipoNotificacion.PROXIMO_VENCIMIENTO,
      })),
    });

    this.logger.warn(`Cuotas marcadas como atrasadas: ${cuotas.length}`);
  }
}
