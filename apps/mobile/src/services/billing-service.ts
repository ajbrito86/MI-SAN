import { Platform } from 'react-native';
import type { Product, Purchase } from 'react-native-iap';
import type { CompraPremiumPayload } from './suscripciones-service';

type ModuloBilling = typeof import('react-native-iap');

declare const require: (nombre: string) => ModuloBilling;

const PREMIUM_PRODUCT_ID_DEFAULT = 'premium_sin_ads';

function cargarModuloBilling() {
  if (!['android', 'ios'].includes(Platform.OS) || process.env.EXPO_PUBLIC_ENABLE_NATIVE_BILLING !== 'true') {
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

export function obtenerPremiumProductId() {
  return process.env.EXPO_PUBLIC_PREMIUM_PRODUCT_ID || process.env.EXPO_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID || PREMIUM_PRODUCT_ID_DEFAULT;
}

export async function obtenerProductoPremium() {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerPremiumProductId();
  await moduloBilling.initConnection();
  await limpiarComprasPendientesAndroid(moduloBilling);
  const productos = await moduloBilling.getProducts({ skus: [productId] });

  return productos[0] ?? null;
}

export async function iniciarCompraPremium(usuarioId?: string | null) {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerPremiumProductId();
  await moduloBilling.initConnection();
  await limpiarComprasPendientesAndroid(moduloBilling);
  const compra =
    Platform.OS === 'ios'
      ? await moduloBilling.requestPurchase({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          appAccountToken: usuarioId ?? undefined,
        })
      : await moduloBilling.requestPurchase({
          skus: [productId],
          obfuscatedAccountIdAndroid: usuarioId ?? undefined,
        });

  return primeraCompra(compra);
}

export async function restaurarCompraPremium() {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return null;
  }

  const productId = obtenerPremiumProductId();
  await moduloBilling.initConnection();
  const compras = await moduloBilling.getAvailablePurchases({
    automaticallyFinishRestoredTransactions: false,
    onlyIncludeActiveItems: true,
  });

  return compras.find((compra) => compra.productId === productId) ?? null;
}

export async function finalizarCompraPremium(compra: Purchase) {
  const moduloBilling = cargarModuloBilling();

  if (!moduloBilling) {
    return;
  }

  await moduloBilling.finishTransaction({ purchase: compra, isConsumable: false });
}

export function crearPayloadPremium(compra: Purchase): CompraPremiumPayload {
  return {
    plataformaCompra: Platform.OS === 'ios' ? 'APP_STORE' : 'GOOGLE_PLAY',
    productId: compra.productId,
    purchaseToken: compra.purchaseToken,
    transactionReceipt: compra.transactionReceipt,
    transaccionExternaId: compra.transactionId,
    packageNameAndroid: compra.packageNameAndroid,
    originalTransactionIdIos: compra.originalTransactionIdentifierIOS,
    appBundleIdIos: compra.appBundleIdIos,
    jwsRepresentationIos: compra.jwsRepresentationIos,
    environmentIos: compra.environmentIos,
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

async function limpiarComprasPendientesAndroid(moduloBilling: ModuloBilling) {
  if (Platform.OS === 'android') {
    await moduloBilling.flushFailedPurchasesCachedAsPendingAndroid().catch(() => false);
  }
}
