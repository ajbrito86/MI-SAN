
# 06 - Instrucciones Codex - Implementación Monetización MI-SAN

## Objetivo

Implementar toda la infraestructura necesaria para soportar monetización, anuncios y planes comerciales en MI-SAN.

---

# Stack

Frontend:
- React Native + Expo
- TanStack Query
- Zustand
- TypeScript

Backend:
- NestJS
- Prisma ORM
- PostgreSQL

Toda la implementación deberá realizarse en español.

Variables, métodos, clases y comentarios deberán escribirse en español.

---

# Requerimientos funcionales

## RF-01

Todo usuario nuevo deberá recibir automáticamente un Trial Premium de 45 días.

---

## RF-02

Al finalizar el Trial, el usuario deberá pasar automáticamente al plan gratuito con anuncios.

---

## RF-03

Los usuarios Premium nunca visualizarán anuncios.

---

## RF-04

Los usuarios gratuitos visualizarán anuncios según las reglas definidas.

---

# Modelo de datos

Crear las siguientes entidades:

## Rol

Campos mínimos:

- id
- nombre
- descripcion
- isActive
- createdAt
- updatedAt

Valores iniciales:

- ADMIN
- USUARIO

---

## Plan

Campos:

- id
- codigo
- nombre
- descripcion
- precio
- duracionDias
- permiteAds
- isPagoUnico
- isActive
- createdAt
- updatedAt

Valores iniciales:

- GRATIS_TRIAL
- GRATIS_ADS
- PREMIUM_SIN_ADS

---

## UsuarioPlan

Campos:

- id
- usuarioId
- planId
- fechaInicio
- fechaFin
- estado
- plataformaCompra
- transaccionExternaId
- esTrial
- isActive
- createdAt
- updatedAt

Restricción:

Un único plan activo por usuario.

---

# Backend

Crear módulo:

```text
SuscripcionesModule
```

Componentes:

```text
SuscripcionesController
SuscripcionesService
SuscripcionesCronService
```

---

# Endpoints

## Obtener suscripción actual

```http
GET /suscripciones/actual
```

---

## Comprar Premium

```http
POST /suscripciones/comprar
```

---

## Restaurar compra

```http
POST /suscripciones/restaurar
```

---

## Historial suscripciones

```http
GET /suscripciones/historial
```

---

# Cron Jobs

Crear cron diario:

```typescript
@Cron('0 0 * * *')
```

Responsabilidades:

- Buscar trials vencidos.
- Expirar trials.
- Crear GRATIS_ADS.
- Registrar auditoría.

---

# Integración AdMob

Instalar:

```bash
npm install react-native-google-mobile-ads
```

Crear:

```text
AdsProvider
AdsService
BannerAdComponent
InterstitialService
```

---

# Hook personalizado

Crear:

```typescript
useSuscripcion()
```

Respuesta:

```typescript
{
  premium: boolean;
  mostrarAds: boolean;
  plan: string;
  diasRestantes: number;
}
```

---

# Componentes Frontend

Crear:

```text
PantallaPremium
TarjetaPremium
BannerPublicidad
BotonEliminarAds
```

---

# Reglas Frontend

Si:

```typescript
mostrarAds === false
```

No renderizar ningún anuncio.

---

# Pantalla Premium

Mostrar:

- Beneficios Premium.
- Precio US$0.99.
- Botón comprar.
- Botón restaurar compras.

---

# Google Billing

Preparar integración para:

Google Play Billing.

Toda compra deberá ser validada por backend.

Nunca confiar únicamente en el dispositivo.

---

# Apple IAP

Preparar integración para:

Apple In-App Purchases.

Implementar restauración de compras.

---

# Analíticas

Registrar eventos:

- trial_iniciado
- trial_expirado
- premium_comprado
- premium_restaurado
- banner_mostrado
- banner_click

---

# Seguridad

Todas las decisiones de monetización deberán calcularse desde backend.

El frontend nunca decidirá permisos.

---

# Criterios de aceptación

✅ Usuario nuevo recibe Trial.

✅ Trial expira automáticamente.

✅ Usuarios gratuitos ven anuncios.

✅ Usuarios Premium no ven anuncios.

✅ Compra Premium elimina anuncios.

✅ Restauración funciona.

✅ Toda lógica está protegida por backend.

IMPORTANTE:

La solución debe ser incremental, limpia y preparada para futuras expansiones comerciales.
