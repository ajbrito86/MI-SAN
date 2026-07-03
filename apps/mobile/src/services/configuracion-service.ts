import { apiRequest } from './api';

export type ConfiguracionMobile = {
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

export function obtenerConfiguracionMobile() {
  return apiRequest<ConfiguracionMobile>('/configuracion/mobile');
}
