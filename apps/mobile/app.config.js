const { withAppBuildGradle } = require('expo/config-plugins');
const { existsSync } = require('fs');
const { resolve } = require('path');

const TEST_ADMOB = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  androidBannerId: 'ca-app-pub-3940256099942544/6300978111',
  androidInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  iosBannerId: 'ca-app-pub-3940256099942544/2934735716',
  iosInterstitialId: 'ca-app-pub-3940256099942544/4411468910',
};

function env(clave, fallback) {
  return process.env[clave] || fallback;
}

function envAdMob(clave, fallback) {
  return [process.env[clave], process.env[`EXPO_PUBLIC_${clave}`], fallback].find((valor) => !valorAdMobPendiente(valor)) || fallback;
}

function valorAdMobPendiente(valor) {
  return (
    !valor ||
    valor.includes('replace_with_') ||
    valor.includes('xxxxxxxx') ||
    valor.includes('yyyyyyyy') ||
    valor.includes('3940256099942544')
  );
}

function envBoolean(clave, fallback = false) {
  const valor = process.env[clave];

  if (valor === undefined) {
    return fallback;
  }

  return valor === 'true';
}

function validarAdMobProduccion(admob) {
  const esBuildProduccion = process.env.EAS_BUILD_PROFILE === 'production';
  const usaAdsDePrueba = envBoolean('EXPO_PUBLIC_ADS_TEST_MODE');
  const adsNativosActivos = envBoolean('EXPO_PUBLIC_ENABLE_NATIVE_ADS', true);

  if (!esBuildProduccion || usaAdsDePrueba || !adsNativosActivos) {
    return;
  }

  const plataformas = process.env.EAS_BUILD_PLATFORM === 'ios' || process.env.ADMOB_REQUIRE_IOS === 'true' ? ['android', 'ios'] : ['android'];
  const pendientes = Object.entries(admob)
    .filter(([clave, valor]) => plataformas.some((plataforma) => clave.startsWith(plataforma)) && valorAdMobPendiente(valor))
    .map(([clave]) => clave);

  if (pendientes.length > 0) {
    throw new Error(`AdMob production requiere IDs reales: ${pendientes.join(', ')}`);
  }
}

function valoresUnicos(valores) {
  return [...new Set(valores.filter(Boolean))];
}

function esquemaGoogle(clientId) {
  const sufijo = '.apps.googleusercontent.com';

  if (!clientId || !clientId.endsWith(sufijo)) {
    return null;
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -sufijo.length)}`;
}

function esquemaGoogleAndroid() {
  return esquemaGoogle(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      '107458796974-sf1vc8erhk0l877234j7hm8brddfsj2v.apps.googleusercontent.com',
  );
}

function esquemaGoogleIos() {
  return esquemaGoogle(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
}

function archivoGoogleServicesAndroid() {
  const archivoConfigurado = process.env.GOOGLE_SERVICES_JSON;

  if (archivoConfigurado) {
    return archivoConfigurado;
  }

  const archivoLocal = './google-services.json';
  return existsSync(resolve(__dirname, archivoLocal)) ? archivoLocal : null;
}

function sinPluginAds(plugins = []) {
  return plugins.filter((plugin) => {
    const nombre = Array.isArray(plugin) ? plugin[0] : plugin;
    return nombre !== 'react-native-google-mobile-ads';
  });
}

function sinPluginNotifications(plugins = []) {
  return plugins.filter((plugin) => {
    const nombre = Array.isArray(plugin) ? plugin[0] : plugin;
    return nombre !== 'expo-notifications';
  });
}

function sinPluginBilling(plugins = []) {
  return plugins.filter((plugin) => {
    const nombre = Array.isArray(plugin) ? plugin[0] : plugin;
    return nombre !== 'react-native-iap';
  });
}

function aplicarSkipKotlinMetadata(config) {
  return withAppBuildGradle(config, (configuracion) => {
    const bloque = `

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
  kotlinOptions {
    freeCompilerArgs += ['-Xskip-metadata-version-check']
  }
}
`;

    if (!configuracion.modResults.contents.includes('-Xskip-metadata-version-check')) {
      configuracion.modResults.contents += bloque;
    }

    return configuracion;
  });
}

module.exports = ({ config }) => {
  const adsNativosActivos = envBoolean('EXPO_PUBLIC_ENABLE_NATIVE_ADS', true);
  const pushNativoActivo = envBoolean('EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', true);
  const billingNativoActivo = envBoolean('EXPO_PUBLIC_ENABLE_NATIVE_BILLING', true);
  const googleServicesFile = archivoGoogleServicesAndroid();
  const pluginsBase = [
    pushNativoActivo ? config.plugins : sinPluginNotifications(config.plugins),
    billingNativoActivo,
  ].reduce((plugins, activo) => (activo === true ? plugins : sinPluginBilling(plugins)));
  const admob = {
    androidAppId: envAdMob('ADMOB_ANDROID_APP_ID', TEST_ADMOB.androidAppId),
    androidBannerId: envAdMob('ADMOB_ANDROID_BANNER_ID', TEST_ADMOB.androidBannerId),
    androidInterstitialId: envAdMob('ADMOB_ANDROID_INTERSTITIAL_ID', TEST_ADMOB.androidInterstitialId),
    iosAppId: envAdMob('ADMOB_IOS_APP_ID', TEST_ADMOB.iosAppId),
    iosBannerId: envAdMob('ADMOB_IOS_BANNER_ID', TEST_ADMOB.iosBannerId),
    iosInterstitialId: envAdMob('ADMOB_IOS_INTERSTITIAL_ID', TEST_ADMOB.iosInterstitialId),
  };

  validarAdMobProduccion(admob);

  return aplicarSkipKotlinMetadata({
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    plugins: adsNativosActivos
      ? [
          ...sinPluginAds(pluginsBase),
          [
            'react-native-google-mobile-ads',
            {
              androidAppId: admob.androidAppId,
              iosAppId: admob.iosAppId,
            },
          ],
        ]
      : sinPluginAds(pluginsBase),
    scheme: valoresUnicos([
      ...(Array.isArray(config.scheme) ? config.scheme : [config.scheme]),
      esquemaGoogleAndroid(),
      esquemaGoogleIos(),
    ]),
    extra: {
      ...config.extra,
      admob,
    },
  });
};
