# Billing Real Checklist MI-SAN

## Producto Google Play

| Campo | Valor |
| --- | --- |
| Product ID | `premium_sin_ads` |
| Tipo | Non-consumable |
| Precio inicial | US$0.99 |
| Beneficio | Premium sin anuncios |
| Estado | Pendiente crear en Google Play Console |

## Producto Apple

| Campo | Valor |
| --- | --- |
| Product ID | `com.misan.premium.noads` |
| Tipo | Non-consumable |
| Precio inicial | US$0.99 |
| Beneficio | Premium sin anuncios |
| Estado | Pendiente crear en App Store Connect |

## Requisitos Funcionales

- Pantalla Premium existe.
- Boton Comprar Premium existe.
- Boton Restaurar compras existe.
- Backend tiene endpoints:
  - `POST /api/suscripciones/comprar`
  - `POST /api/suscripciones/restaurar`
- Backend registra auditoria de compra/restauracion.
- Feature flag `comprasActivas` permite apagar compras remotamente.

## Pendiente Antes De Produccion

- Integrar SDK de compras real.
- Validar compra contra Google Play desde backend.
- Validar compra contra Apple desde backend.
- Guardar `transaccionExternaId` real.
- Manejar reembolsos.
- Probar restauracion en iOS.
- Probar compra en Google Play Internal Testing.

## Regla De Release

Si Billing real no esta validado, Premium puede mantenerse desactivado con:

```json
{
  "featureFlags": {
    "premiumActivo": false,
    "comprasActivas": false
  }
}
```

Esto permite avanzar con closed testing sin romper la experiencia.
