const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const APP_ID_PRUEBA_IOS = 'ca-app-pub-3940256099942544~1458002511';
const PATRON_APP_ID = /^ca-app-pub-\d{16}~\d{10}$/;

function obtenerAppId() {
  return process.env.ADMOB_IOS_APP_ID || process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
}

function configurarAdMobIos() {
  if (process.env.EAS_BUILD_PLATFORM !== 'ios') {
    return;
  }

  const appId = obtenerAppId();
  const esProduccion = process.env.EAS_BUILD_PROFILE === 'production';
  const modoPrueba = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';

  if (!appId) {
    if (modoPrueba && !esProduccion) {
      return;
    }

    throw new Error('El build iOS requiere ADMOB_IOS_APP_ID.');
  }

  if (!PATRON_APP_ID.test(appId)) {
    throw new Error('ADMOB_IOS_APP_ID no tiene el formato esperado de AdMob.');
  }

  if (esProduccion && (modoPrueba || appId === APP_ID_PRUEBA_IOS)) {
    throw new Error('El build iOS de produccion no puede usar el App ID de prueba de AdMob.');
  }

  const rutaInfoPlist = resolve(__dirname, '../ios/MiSan/Info.plist');
  const contenido = readFileSync(rutaInfoPlist, 'utf8');
  const patronClave = /(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/;

  if (!patronClave.test(contenido)) {
    throw new Error('Info.plist no contiene GADApplicationIdentifier.');
  }

  writeFileSync(rutaInfoPlist, contenido.replace(patronClave, `$1${appId}$2`));
  console.info('AdMob iOS configurado para el build.');
}

configurarAdMobIos();
