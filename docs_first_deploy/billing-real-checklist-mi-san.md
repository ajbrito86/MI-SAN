# Billing Real Checklist MI-SAN

## Producto Google Play

| Campo | Valor |
| --- | --- |
| Product ID | `premium_sin_ads` |
| Tipo | Non-consumable |
| Precio inicial | US$4.99 |
| Beneficio | Premium sin anuncios |
| Estado | Pendiente crear en Google Play Console |

## Producto Apple

| Campo | Valor |
| --- | --- |
| Product ID | `premium_sin_ads` |
| Tipo | Non-consumable |
| Precio inicial | US$4.99 |
| Beneficio | Premium sin anuncios |
| Estado | Ready to Submit en App Store Connect |

## Requisitos Funcionales

- Pantalla Premium existe.
- Boton Comprar Premium existe.
- Boton Restaurar compras existe.
- App Android integra Google Play Billing nativo con `react-native-iap`.
- App iOS integra StoreKit nativo con `react-native-iap`.
- Backend tiene endpoints:
  - `POST /api/suscripciones/comprar`
  - `POST /api/suscripciones/restaurar`
- Backend valida `purchaseToken` contra Google Play Developer API cuando `BILLING_REAL_ENABLED=true`.
- Backend valida `transactionReceipt` contra App Store cuando `BILLING_REAL_ENABLED=true`.
- Backend reconoce compras no consumibles despues de validarlas.
- Backend registra auditoria de compra/restauracion.
- Feature flag `comprasActivas` permite apagar compras remotamente.

## Pendiente Antes De Produccion

- Crear producto real `premium_sin_ads` en Google Play Console.
- Cargar credenciales de service account en `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`.
- Configurar `APP_STORE_BUNDLE_ID=app.mi-san.mobile`.
- Activar `BILLING_REAL_ENABLED=true` solo cuando Google Play Console y App Store Connect esten listos.
- Guardar `transaccionExternaId` real.
- Manejar reembolsos.
- Probar restauracion en iOS.
- Probar compra en Google Play Internal Testing.

## Regla De Release

Si Billing real no esta validado, Premium debe mantenerse desactivado con:

```json
{
  "featureFlags": {
    "premiumActivo": false,
    "comprasActivas": false
  }
}
```

En produccion el backend fuerza `comprasActivas=false` mientras `BILLING_REAL_ENABLED` no sea `true`.

Los endpoints `POST /api/suscripciones/comprar` y `POST /api/suscripciones/restaurar` no pueden activar Premium en produccion sin Billing real, salvo que se active explicitamente `ALLOW_MANUAL_PREMIUM_ACTIVATION=true` para una operacion controlada.

Esto permite avanzar con closed testing sin simular compras reales ni romper la experiencia.
