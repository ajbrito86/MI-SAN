import { Controller, Get } from '@nestjs/common';

@Controller('salud')
export class SaludController {
  @Get()
  obtenerEstado() {
    return obtenerPayloadSalud();
  }
}

@Controller('health')
export class HealthController {
  @Get()
  obtenerEstado() {
    return obtenerPayloadSalud();
  }
}

function obtenerPayloadSalud() {
  return {
    estado: 'ok',
    servicio: 'Mi-San API',
    fecha: new Date().toISOString(),
  };
}
