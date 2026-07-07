import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CONFIGURACION_MOBILE = 'mobile_config';

type ConfiguracionMobile = {
  mantenimiento: {
    activo: boolean;
    mensaje: string;
  };
  version: {
    versionMinima: string;
    forzarActualizacion: boolean;
    mensajeActualizacion: string;
  };
  featureFlags: {
    anunciosActivos: boolean;
    premiumActivo: boolean;
    trialActivo: boolean;
    comprasActivas: boolean;
  };
  monetizacion: {
    duracionTrialDias: number;
    precioPremiumUsd: number;
    frecuenciaInterstitialMinutos: number;
  };
  mensajes: {
    global: string | null;
  };
};

const CONFIGURACION_DEFAULT: ConfiguracionMobile = {
  mantenimiento: {
    activo: false,
    mensaje: 'MI-SAN esta en mantenimiento temporal. Intenta nuevamente en unos minutos.',
  },
  version: {
    versionMinima: '1.0.0',
    forzarActualizacion: false,
    mensajeActualizacion: 'Hay una nueva version de MI-SAN disponible.',
  },
  featureFlags: {
    anunciosActivos: true,
    premiumActivo: true,
    trialActivo: true,
    comprasActivas: true,
  },
  monetizacion: {
    duracionTrialDias: 45,
    precioPremiumUsd: 4.99,
    frecuenciaInterstitialMinutos: 10,
  },
  mensajes: {
    global: null,
  },
};

@Injectable()
export class ConfiguracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async obtenerConfiguracionMobile() {
    const configuracion = await this.prisma.configuracionGlobal.upsert({
      where: { clave: CONFIGURACION_MOBILE },
      update: {},
      create: {
        clave: CONFIGURACION_MOBILE,
        valorJson: CONFIGURACION_DEFAULT as Prisma.InputJsonValue,
        descripcion: 'Configuracion publica consumida por la app movil.',
        isPublic: true,
        isActive: true,
      },
    });

    const resultado = {
      ...CONFIGURACION_DEFAULT,
      ...(configuracion.valorJson as Partial<ConfiguracionMobile>),
    };

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      const billingRealHabilitado = this.configService.get<string>('BILLING_REAL_ENABLED') === 'true';
      const activacionManualPermitida = this.configService.get<string>('ALLOW_MANUAL_PREMIUM_ACTIVATION') === 'true';

      if (!billingRealHabilitado && !activacionManualPermitida) {
        resultado.featureFlags = {
          ...resultado.featureFlags,
          comprasActivas: false,
        };
      }
    }

    return resultado;
  }
}
