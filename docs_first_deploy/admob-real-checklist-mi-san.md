# AdMob Real Checklist MI-SAN

## Estado Actual

La app esta integrada con `react-native-google-mobile-ads`, UMP y feature flags.

Actualmente `apps/mobile/app.config.js` usa IDs oficiales de prueba solo como fallback para desarrollo. `apps/mobile/app.json` no debe hardcodear IDs de AdMob.

En Expo Go/desarrollo local `EXPO_PUBLIC_ENABLE_NATIVE_ADS=false` evita cargar el modulo nativo de AdMob. Para la fase Android, los builds EAS Android `internal`, `preview` y `production` deben usar `EXPO_PUBLIC_ENABLE_NATIVE_ADS=true` cuando ya existan IDs reales.

## Fase Actual: Android

| Elemento | Estado | Donde Configurarlo |
| --- | --- | --- |
| App ID Android real | Pendiente | `ADMOB_ANDROID_APP_ID` |
| Banner Unit ID Android | Pendiente | `ADMOB_ANDROID_BANNER_ID` |
| Interstitial Unit ID Android | Pendiente | `ADMOB_ANDROID_INTERSTITIAL_ID` |
| Android package name | Confirmado | `app.mi_san.mobile` |

## Fase Posterior: iOS

| Elemento | Estado | Donde Configurarlo |
| --- | --- | --- |
| App ID iOS real | Pendiente posterior | `ADMOB_IOS_APP_ID` |
| Banner Unit ID iOS | Pendiente posterior | `ADMOB_IOS_BANNER_ID` |
| Interstitial Unit ID iOS | Pendiente posterior | `ADMOB_IOS_INTERSTITIAL_ID` |

## Reglas De Release

- En desarrollo se permiten IDs de prueba.
- En produccion Android no se permiten IDs de prueba para `ADMOB_ANDROID_*`.
- Expo Go no incluye el modulo nativo de AdMob; usar `EXPO_PUBLIC_ENABLE_NATIVE_ADS=false` localmente.
- Builds nativos EAS Android deben usar `EXPO_PUBLIC_ENABLE_NATIVE_ADS=true` cuando se pruebe AdMob real.
- Usuarios Premium no deben ver anuncios.
- Usuarios gratuitos solo pueden ver banners en Dashboard, Historial y Reportes.
- No se muestran anuncios durante login, registro, pagos, formularios, invitaciones, confirmaciones de turnos ni acciones criticas.
- Los interstitials solo se intentan despues de acciones completadas y con frecuencia limitada.
- Ejecutar preflight normal antes de pruebas internas:

```bash
npm run release:preflight
```

- Ejecutar preflight estricto antes de build comercial:

```bash
$env:NODE_ENV='production'; npm run release:preflight
```

El preflight estricto valida `apps/mobile/.env.production`, que queda ignorado por git, y falla si detecta placeholders o IDs oficiales de prueba en Android. iOS queda como aviso hasta su fase.

## Confirmaciones Antes De Build

- App creada en AdMob.
- Android package name coincide con `app.mi_san.mobile`.
- iOS bundle identifier coincide con `app.mi-san.mobile`.
- UMP configurado y probado.
- Banner aparece solo si `suscripcion.mostrarAds` es verdadero.
- Premium oculta anuncios.
- Feature flag `anunciosActivos` permite apagar anuncios remotamente.
