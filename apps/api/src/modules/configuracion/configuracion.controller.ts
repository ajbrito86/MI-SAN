import { Controller, Get } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get('mobile')
  obtenerConfiguracionMobile() {
    return this.configuracionService.obtenerConfiguracionMobile();
  }
}
