import { useQuery } from '@tanstack/react-query';
import { type ConfiguracionMobile, obtenerConfiguracionMobile } from '@/services/configuracion-service';

export const CONFIGURACION_MOBILE_DEFAULT: ConfiguracionMobile = {
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
    comprasActivas: false,
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

export function useConfiguracionMobile() {
  return useQuery({
    queryKey: ['configuracion-mobile'],
    queryFn: obtenerConfiguracionMobile,
    initialData: CONFIGURACION_MOBILE_DEFAULT,
    staleTime: 60000,
    retry: 1,
  });
}
