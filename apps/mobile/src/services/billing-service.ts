import { Platform } from 'react-native';
import type { Product, Purchase } from 'react-native-iap';
import type { CompraPremiumPayload } from './suscripciones-service';

type ModuloBilling = typeof import('react-native-iap');

declare const require: (nombre: string) => ModuloBilling;

const GOOGLE_PLAY_PRODUCT_ID_DEFAULT = 'premium_sin_ads';

function cargarModuloBilling() {
  if (Platform.OS !== 'android' || process.env.EXPO_PUBLIC_ENABLE_NATIVE_BILLING !== 'true') {
    return null;
  }

  try {
    return require('react-native-iap');
  } catch {
    return null;
  }
}

export function billingNativoHabilitado() {
  return Boolean(cargarModuloBilling());
}

export function obtenerGooglePlayPremiumProductId() {
  return process.env.EXPO_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID || GOOGLE_PLAY_PRODUCT_ID_DEFAULT;
}

export async function obtenerProductoPremiumGooglePlay() {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerGooglePlayPremiumProductId();
  await moduloBilling.initConnection();
  await moduloBilling.flushFailedPurchasesCachedAsPendingAndroid().catch(() => false);
  const productos = await moduloBilling.getProducts({ skus: [productId] });

  return productos[0] ?? null;
}

export async function iniciarCompraPremiumGooglePlay(usuarioId?: string | null) {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerGooglePlayPremiumProductId();
  await moduloBilling.initConnection();
  await moduloBilling.flushFailedPurchasesCachedAsPendingAndroid().catch(() => false);
  const compra = await moduloBilling.requestPurchase({
    skus: [productId],
    obfuscatedAccountIdAndroid: usuarioId ?? undefined,
  });

  return primeraCompra(compra);
}

export async function restaurarCompraPremiumGooglePlay() {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerGooglePlayPremiumProductId();
  await moduloBilling.initConnection();
  const compras = await moduloBilling.getAvailablePurchases();

  return compras.find((compra) => compra.productId === productId) ?? null;
}

export async function finalizarCompraPremiumGooglePlay(compra: Purchase) {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return;
  }

  await moduloBilling.finishTransaction({ purchase: compra, isConsumable: false });
}

export function crearPayloadPremiumGooglePlay(compra: Purchase): CompraPremiumPayload {
  return {
    plataformaCompra: 'GOOGLE_PLAY',
    productId: compra.productId,
    purchaseToken: compra.purchaseToken,
    transactionReceipt: compra.transactionReceipt,
    transaccionExternaId: compra.transactionId,
    packageNameAndroid: compra.packageNameAndroid,
  };
}

export function formatearPrecioProducto(producto: Product | null | undefined, fallback: string) {
  return producto?.localizedPrice || producto?.displayPrice || fallback;
}

function primeraCompra(compra: Purchase | Purchase[] | void | null) {
  if (!compra) {
    return null;
  }

  return Array.isArray(compra) ? compra[0] ?? null : compra;
}
