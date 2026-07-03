# Release Readiness MI-SAN

## Tabla Ejecutiva

| Bloque | Estado | Responsable | Bloqueante |
| --- | --- | --- | --- |
| Codigo app | Listo para preflight | Codex / Desarrollo | No |
| Backend | Listo para deploy VPS | Codex / Desarrollo | No |
| Base de datos produccion | Pendiente | Infraestructura | Si |
| Dominio/HTTPS | Pendiente | Infraestructura | Si |
| AdMob | Pendiente credenciales reales | Producto / Monetizacion | Si para build comercial |
| Billing | Preparado, pendiente productos reales | Producto / Tiendas | Si para Premium comercial |
| Google Play | Pendiente cuenta y consola | Producto | Si |
| App Store | Pendiente cuenta y consola | Producto | Si |
| Screenshots reales | Pendiente build/dispositivo | Producto / QA | Si |
| Legal publico | Preparado en API, pendiente URL publica | Infraestructura | Si |
| Testing cerrado | Pendiente builds | QA / Producto | Si |

## Criterio De Exito De Esta Etapa

Cuando existan VPS, dominio HTTPS, cuentas reales y credenciales de AdMob/Billing, el proyecto debe requerir solo:

1. Reemplazar variables/App IDs reales.
2. Ejecutar migraciones y seed en produccion.
3. Ejecutar `npm run release:preflight` en modo estricto.
4. Generar AAB y build iOS.
5. Subir a pruebas cerradas.

## Completado En Codigo

- Trial Premium de 45 dias.
- Plan gratis con anuncios.
- Premium sin anuncios.
- Endpoints de suscripcion.
- Cron diario para expirar trials.
- AdMob integrado con IDs de prueba.
- UMP / privacidad de anuncios preparada.
- Pantalla Premium.
- Pantalla eliminar cuenta.
- Politica de privacidad publica.
- Terminos publicos.
- Soporte publico.
- Metadata base de tiendas.
- Cuenta demo de revision.
- Icono, splash, adaptive icon, favicon.
- Feature graphic y mockups sociales base.
- EAS profiles para builds.
- CORS configurable.
- Rate limiting backend.
- Validacion de secretos JWT en produccion.
- Analitica interna de eventos.
- Reporte basico de errores globales del movil.
- Eventos de monetizacion y anuncios registrados.
- Recuperacion de contrasena con codigo temporal.
- Edicion de perfil desde la app.
- Preflight automatizado de release.
- Data Safety Google Play preparado.
- App Privacy Apple preparado.
- Feature flags desde backend.
- Configuracion global publica para app movil.
- Modo mantenimiento controlado desde backend.
- Version minima / actualizacion forzada desde backend.
- Auditoria de monetizacion.
- Separacion desarrollo/staging/produccion documentada.
- Preflight valida API publica HTTPS y bloquea localhost/IP privada/http.

## Pendiente Externo

- Dominio `mi-san.app`.
- Subdominio/API publica `api.mi-san.app`.
- HTTPS productivo.
- Base de datos productiva.
- Cuenta Google Play Developer.
- Cuenta Apple Developer.
- App real en AdMob.
- Unit IDs reales de AdMob.
- In-App Purchase real en App Store.
- Producto de compra real en Google Play.
- TestFlight.
- Closed testing Google Play.
- Screenshots reales tomadas desde builds.
- Proveedor final de crash reporting si se decide usar Firebase Crashlytics o Sentry.
- Proveedor de correo/SMS para enviar codigos de recuperacion en produccion.

## Pendiente Tecnico Antes Del Build Comercial

- Reemplazar App IDs AdMob de prueba en `apps/mobile/app.json`.
- Configurar `EXPO_PUBLIC_ADMOB_*` reales.
- Configurar `EXPO_PUBLIC_API_BASE_URL` real en EAS.
- Ejecutar migraciones en produccion.
- Ejecutar seed o crear cuenta demo en produccion.
- Verificar enlaces legales publicos.
- Generar AAB con `npm run mobile:build:android`.
- Generar build iOS con `npm run mobile:build:ios`.

## Validaciones Ejecutadas

- `npm run api:build`
- `npx tsc --noEmit -p apps/api/tsconfig.json`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npx expo config --type public`
- `npm run release:preflight`

## Ultimo Preflight

- Normal: 0 errores, 5 avisos.
- Estricto produccion: falla correctamente por App IDs/Unit IDs de AdMob de prueba o placeholder.
