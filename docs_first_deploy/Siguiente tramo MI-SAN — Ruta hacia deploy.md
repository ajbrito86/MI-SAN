# Siguiente tramo MI-SAN — Ruta hacia 90%

Excelente avance con `release:preflight`.

Ahora necesitamos atacar lo que todavía impide un release real.

## Prioridad 1 — Infraestructura productiva

Preparar el proyecto para apuntar a una API pública real por HTTPS.

Requerido:

- Documentar variables de entorno productivas necesarias.
- Separar claramente:
  - desarrollo
  - staging
  - producción
- Validar que el build mobile nunca use localhost.
- Agregar validación en `release-preflight.js` para fallar si `API_URL` contiene:
  - localhost
  - 127.0.0.1
  - IP privada
  - http:// sin HTTPS

## Prioridad 2 — Checklist AdMob real

Crear un documento:

`docs_first_deploy/admob-real-checklist-mi-san.md`

Debe incluir:

- App ID Android real pendiente.
- App ID iOS real pendiente.
- Banner Unit ID Android pendiente.
- Banner Unit ID iOS pendiente.
- Interstitial Unit ID Android pendiente.
- Interstitial Unit ID iOS pendiente.
- Confirmar que en producción no se usen IDs de prueba.

Agregar al preflight:

- Warning si usa test IDs.
- Error si `NODE_ENV=production` y usa test IDs.

## Prioridad 3 — Billing real

Crear documento:

`docs_first_deploy/billing-real-checklist-mi-san.md`

Debe cubrir:

- Producto Google Play:
  - `premium_sin_ads`
- Producto Apple:
  - `com.misan.premium.noads`
- Tipo:
  - Non-consumable
- Precio:
  - US$4.99
- Restaurar compras obligatorio.
- Validación backend pendiente.

## Prioridad 4 — Build real

Preparar comandos documentados para:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production


Y crear:

docs_first_deploy/build-production-guide-mi-san.md

Incluyendo:

Requisitos previos.
Variables necesarias.
Cómo correr preflight antes del build.
Cómo generar AAB Android.
Cómo preparar build iOS para TestFlight.
Prioridad 5 — Release readiness

Actualizar release-readiness-mi-san.md con una tabla clara:

Bloque	Estado	Responsable	Bloqueante

Bloques mínimos:

Código app
Backend
Base de datos producción
Dominio/HTTPS
AdMob
Billing
Google Play
App Store
Screenshots reales
Legal público
Testing cerrado
Criterio de éxito de esta etapa

Al finalizar, el proyecto debe estar listo para que cuando se creen las cuentas reales y el dominio/API pública, solo tengamos que reemplazar credenciales y correr build.
