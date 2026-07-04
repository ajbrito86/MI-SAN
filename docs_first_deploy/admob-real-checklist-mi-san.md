# AdMob Real Checklist MI-SAN

## Estado Actual

La app esta integrada con `react-native-google-mobile-ads`, UMP y feature flags.

Actualmente `apps/mobile/app.json` usa App IDs oficiales de prueba.

En Expo Go/desarrollo local `EXPO_PUBLIC_ENABLE_NATIVE_ADS=false` evita cargar el modulo nativo de AdMob. En builds EAS `internal`, `preview` y `production` el flag queda en `true` para usar anuncios reales dentro del binario nativo.

## Pendientes Reales

| Elemento | Estado | Donde Configurarlo |
| --- | --- | --- |
| App ID Android real | Pendiente | `ADMOB_ANDROID_APP_ID` |
| App ID iOS real | Pendiente | `ADMOB_IOS_APP_ID` |
| Banner Unit ID Android | Pendiente | `ADMOB_ANDROID_BANNER_ID` |
| Banner Unit ID iOS | Pendiente | `ADMOB_IOS_BANNER_ID` |
| Interstitial Unit ID Android | Pendiente | `ADMOB_ANDROID_INTERSTITIAL_ID` |
| Interstitial Unit ID iOS | Pendiente | `ADMOB_IOS_INTERSTITIAL_ID` |

## Reglas De Release

- En desarrollo se permiten IDs de prueba.
- En produccion no se permiten IDs de prueba.
- Expo Go no incluye el modulo nativo de AdMob; usar `EXPO_PUBLIC_ENABLE_NATIVE_ADS=false` localmente.
- Builds nativos EAS deben usar `EXPO_PUBLIC_ENABLE_NATIVE_ADS=true`.
- Ejecutar preflight normal antes de pruebas internas:

```bash
npm run release:preflight
```

- Ejecutar preflight estricto antes de build comercial:

```bash
$env:NODE_ENV='production'; npm run release:preflight
```

## Confirmaciones Antes De Build

- App creada en AdMob.
- Android package name coincide con `app.mi_san.mobile`.
- iOS bundle identifier coincide con `app.mi-san.mobile`.
- UMP configurado y probado.
- Banner aparece solo si `suscripcion.mostrarAds` es verdadero.
- Premium oculta anuncios.
- Feature flag `anunciosActivos` permite apagar anuncios remotamente.
