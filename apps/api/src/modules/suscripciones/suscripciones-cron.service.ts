import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SuscripcionesService } from './suscripciones.service';

@Injectable()
export class SuscripcionesCronService {
  private readonly logger = new Logger(SuscripcionesCronService.name);

  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  @Cron('0 0 * * *')
  async expirarTrials() {
    const resultado = await this.suscripcionesService.expirarTrials();

    if (resultado.trialsExpirados > 0) {
      this.logger.log(`Trials expirados: ${resultado.trialsExpirados}`);
    }
  }
}
