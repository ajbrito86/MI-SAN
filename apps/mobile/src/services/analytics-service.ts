import { Platform } from 'react-native';
import { apiRequestAutenticado } from './api';

type TipoEventoAnalitica = 'NEGOCIO' | 'ADS' | 'ERROR' | 'SISTEMA';

type EventoAnalitica = {
  nombre: string;
  tipo?: TipoEventoAnalitica;
  metadataJson?: Record<string, unknown>;
};

const VERSION_APP = '1.0.0';

export async function registrarEvento({ nombre, tipo = 'NEGOCIO', metadataJson }: EventoAnalitica) {
  await apiRequestAutenticado('/analiticas/eventos', {
    method: 'POST',
    body: JSON.stringify({
      nombre,
      tipo,
      plataforma: Platform.OS,
      versionApp: VERSION_APP,
      metadataJson,
    }),
  }).catch(() => null);
}

export function registrarError(nombre: string, error: unknown, metadataJson?: Record<string, unknown>) {
  const mensaje = error instanceof Error ? error.message : 'Error desconocido';

  return registrarEvento({
    nombre,
    tipo: 'ERROR',
    metadataJson: {
      ...metadataJson,
      mensaje,
    },
  });
}

export function configurarReporteErroresGlobales() {
  const errorUtils = (
    globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  const manejadorAnterior = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    registrarError('crash_global', error, { isFatal: Boolean(isFatal) });
    manejadorAnterior?.(error, isFatal);
  });
}
