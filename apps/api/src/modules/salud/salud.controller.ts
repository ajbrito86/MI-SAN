import { Controller, Get } from '@nestjs/common';

@Controller('salud')
export class SaludController {
  @Get()
  obtenerEstado() {
    return {
      estado: 'ok',
      servicio: 'Mi-San API',
      fecha: new Date().toISOString(),
    };
  }
}
