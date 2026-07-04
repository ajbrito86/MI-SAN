# Build Production Guide MI-SAN

## Requisitos Previos

- Node.js 22.
- Dependencias instaladas con `npm install`.
- Cuenta Expo/EAS activa.
- Proyecto configurado en EAS.
- API publica funcionando por HTTPS.
- Dominio o subdominio productivo listo.
- Variables productivas definidas.
- AdMob real configurado antes de build comercial.

## Variables Necesarias Mobile

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mi-san.kingdom-devs.net/api
ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
ADMOB_ANDROID_BANNER_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
ADMOB_ANDROID_INTERSTITIAL_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
ADMOB_IOS_BANNER_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
ADMOB_IOS_INTERSTITIAL_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
```

## Variables Necesarias Backend

Usar como base:

```text
apps/api/.env.production.example
```

Variables minimas:

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://mi-san.kingdom-devs.net
DATABASE_URL=postgresql://usuario:contrasena@host:5432/misan?schema=public
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

Los secretos JWT deben tener al menos 32 caracteres.

## Preflight Antes Del Build

Preflight normal:

```bash
npm run release:preflight
```

Preflight estricto de produccion:

```bash
$env:NODE_ENV='production'; npm run release:preflight
```

El preflight estricto debe pasar sin IDs de prueba ni URLs no seguras.

## Generar AAB Android

```bash
npm run mobile:build:android
```

Equivalente:

```bash
cd apps/mobile
eas build --platform android --profile production
```

Resultado esperado:

- Android App Bundle `.aab`.
- Listo para Internal Testing / Closed Testing en Google Play.

## Preparar Build iOS Para TestFlight

```bash
npm run mobile:build:ios
```

Equivalente:

```bash
cd apps/mobile
eas build --platform ios --profile production
```

Resultado esperado:

- Build iOS listo para App Store Connect / TestFlight.

## Orden Recomendado

1. Deploy backend en VPS.
2. Verificar `https://api.mi-san.kingdom-devs.net/api/salud`.
3. Verificar URLs legales publicas.
4. Configurar AdMob real.
5. Configurar productos Billing/IAP.
6. Ejecutar preflight estricto.
7. Generar AAB Android.
8. Generar build iOS.
9. Subir a Internal Testing / TestFlight.
