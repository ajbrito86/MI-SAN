import { apiRequestAutenticado } from './api';

export type Suscripcion = {
  id: string;
  plan: 'GRATIS_TRIAL' | 'GRATIS_ADS' | 'PREMIUM_SIN_ADS' | string;
  nombrePlan: string;
  premium: boolean;
  mostrarAds: boolean;
  diasRestantes: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: 'ACTIVO' | 'EXPIRADO' | 'CANCELADO' | 'REEMBOLSADO';
  plataformaCompra: 'GOOGLE_PLAY' | 'APP_STORE' | 'MANUAL';
  transaccionExternaId: string | null;
  esTrial: boolean;
  precio: number;
  pagoUnico: boolean;
};

export type CompraPremiumPayload = {
  plataformaCompra?: 'GOOGLE_PLAY' | 'APP_STORE' | 'MANUAL';
  transaccionExternaId?: string;
  productId?: string;
  purchaseToken?: string;
  transactionReceipt?: string;
  packageNameAndroid?: string;
  originalTransactionIdIos?: string;
  appBundleIdIos?: string;
  jwsRepresentationIos?: string;
  environmentIos?: string;
};

export function obtenerSuscripcionActual() {
  return apiRequestAutenticado<Suscripcion>('/suscripciones/actual');
}

export function comprarPremium(payload: CompraPremiumPayload = {}) {
  return apiRequestAutenticado<Suscripcion>('/suscripciones/comprar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function restaurarCompra(payload: CompraPremiumPayload = {}) {
  return apiRequestAutenticado<Suscripcion>('/suscripciones/restaurar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
