import { Platform } from 'react-native';
import { registrarError, registrarEvento } from './analytics-service';

type ModuloAds = typeof import('react-native-google-mobile-ads');

declare const require: (nombre: string) => ModuloAds;

const BANNER_ANDROID_PRUEBA = 'ca-app-pub-3940256099942544/6300978111';
const BANNER_IOS_PRUEBA = 'ca-app-pub-3940256099942544/2934735716';
const INTERSTITIAL_ANDROID_PRUEBA = 'ca-app-pub-3940256099942544/1033173712';
const INTERSTITIAL_IOS_PRUEBA = 'ca-app-pub-3940256099942544/4411468910';
const INTERVALO_INTERSTITIAL_DEFAULT_MS = 10 * 60 * 1000;

let ultimaImpresionInterstitial = 0;

export function adsNativosHabilitados() {
  return process.env.EXPO_PUBLIC_ENABLE_NATIVE_ADS === 'true';
}

function cargarModuloAds() {
  if (Platform.OS === 'web' || !adsNativosHabilitados()) {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export function obtenerBannerAdUnitId() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || BANNER_IOS_PRUEBA;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || BANNER_ANDROID_PRUEBA;
  }

  return null;
}

export function obtenerInterstitialAdUnitId() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS || INTERSTITIAL_IOS_PRUEBA;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID || INTERSTITIAL_ANDROID_PRUEBA;
  }

  return null;
}

export async function inicializarAds() {
  const moduloAds = cargarModuloAds();

  if (!moduloAds) {
    return;
  }

  await moduloAds.AdsConsent.gatherConsent().catch(() => null);
  await moduloAds.default().initialize();
}

export async function mostrarOpcionesPrivacidadAds() {
  const moduloAds = cargarModuloAds();

  if (!moduloAds) {
    return null;
  }

  return moduloAds.AdsConsent.showPrivacyOptionsForm();
}

export function puedeMostrarInterstitial(mostrarAds: boolean, frecuenciaMinutos = 10) {
  if (!mostrarAds || Platform.OS === 'web') {
    return false;
  }

  const intervalo = Math.max(1, frecuenciaMinutos) * 60 * 1000 || INTERVALO_INTERSTITIAL_DEFAULT_MS;
  return Date.now() - ultimaImpresionInterstitial >= intervalo;
}

export async function mostrarInterstitialSiPuede(mostrarAds: boolean, frecuenciaMinutos = 10) {
  if (!puedeMostrarInterstitial(mostrarAds, frecuenciaMinutos)) {
    return false;
  }

  const adUnitId = obtenerInterstitialAdUnitId();

  if (!adUnitId) {
    return false;
  }

  const moduloAds = cargarModuloAds();

  if (!moduloAds) {
    return false;
  }

  const interstitial = moduloAds.InterstitialAd.createForAdRequest(adUnitId);

  return new Promise<boolean>((resolve) => {
    let resuelto = false;

    const resolver = (valor: boolean) => {
      if (!resuelto) {
        resuelto = true;
        resolve(valor);
      }
    };

    const unsubscribeLoaded = interstitial.addAdEventListener(moduloAds.AdEventType.LOADED, () => {
      ultimaImpresionInterstitial = Date.now();
      registrarEvento({ nombre: 'interstitial_mostrado', tipo: 'ADS' });
      interstitial.show().catch(() => resolver(false));
    });

    const unsubscribeClicked = interstitial.addAdEventListener(moduloAds.AdEventType.CLICKED, () => {
      registrarEvento({ nombre: 'interstitial_click', tipo: 'ADS' });
    });

    const unsubscribeClosed = interstitial.addAdEventListener(moduloAds.AdEventType.CLOSED, () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      unsubscribeClicked();
      resolver(true);
    });

    const unsubscribeError = interstitial.addAdEventListener(moduloAds.AdEventType.ERROR, (error) => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      unsubscribeClicked();
      registrarError('interstitial_error', error);
      resolver(false);
    });

    interstitial.load();
  });
}
