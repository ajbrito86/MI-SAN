const { withAppBuildGradle } = require('expo/config-plugins');

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

function valoresUnicos(valores) {
  return [...new Set(valores.filter(Boolean))];
}

function esquemaGoogleAndroid() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const sufijo = '.apps.googleusercontent.com';

  if (!clientId || !clientId.endsWith(sufijo)) {
    return null;
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -sufijo.length)}`;
}

function sinPluginAds(plugins = []) {
  return plugins.filter((plugin) => {
    const nombre = Array.isArray(plugin) ? plugin[0] : plugin;
    return nombre !== 'react-native-google-mobile-ads';
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
  const admob = {
    androidAppId: env('ADMOB_ANDROID_APP_ID', TEST_ADMOB.androidAppId),
    androidBannerId: env('ADMOB_ANDROID_BANNER_ID', TEST_ADMOB.androidBannerId),
    androidInterstitialId: env('ADMOB_ANDROID_INTERSTITIAL_ID', TEST_ADMOB.androidInterstitialId),
    iosAppId: env('ADMOB_IOS_APP_ID', TEST_ADMOB.iosAppId),
    iosBannerId: env('ADMOB_IOS_BANNER_ID', TEST_ADMOB.iosBannerId),
    iosInterstitialId: env('ADMOB_IOS_INTERSTITIAL_ID', TEST_ADMOB.iosInterstitialId),
  };

  return aplicarSkipKotlinMetadata({
    ...config,
    plugins: [
      ...sinPluginAds(config.plugins),
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: admob.androidAppId,
          iosAppId: admob.iosAppId,
        },
      ],
    ],
    scheme: valoresUnicos([
      ...(Array.isArray(config.scheme) ? config.scheme : [config.scheme]),
      esquemaGoogleAndroid(),
    ]),
    extra: {
      ...config.extra,
      admob,
    },
  });
};
